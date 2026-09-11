// FinCopilot India - Automated Test & Computational Verification Suite
import http from 'http';
import { 
  formatINR, 
  parseGSTIN, 
  processCopilotQuery, 
  calculateTaxRegimes 
} from './app.js';
import { 
  DEFAULT_SCHEDULE_III_DATA, 
  SAMPLE_INVOICES, 
  TDS_SECTIONS_MASTER, 
  INDIAN_STATE_GST_CODES 
} from './sample_data.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log("=================================================");
console.log("   FINCOPILOT INDIA - TEST SUITE EXECUTION       ");
console.log("=================================================\n");

// 1. GST Calculation Test (₹10,000 IT Consulting @ 18%)
console.log("--- 1. Testing GST Rules Engine ---");
const gstResult = processCopilotQuery("Calculate GST on ₹10,000 IT consulting invoice");
assert(gstResult.calcCard !== undefined, "Copilot returns calculation card for GST query");
assert(gstResult.calcCard.items.some(i => i.val === "₹900.00"), "CGST 9% on ₹10,000 is correctly ₹900.00");
assert(gstResult.calcCard.items.some(i => i.val === "₹11,800.00"), "Total invoice value is correctly ₹11,800.00");

// 2. GSTIN 15-Digit Checksum & State Code Resolution
console.log("\n--- 2. Testing GSTIN Checksum & State Resolution ---");
const gstinKarnataka = parseGSTIN("29AABBD5678M1Z2");
assert(gstinKarnataka.valid === true, "Valid 15-digit Karnataka GSTIN passed regex");
assert(gstinKarnataka.stateCode === "29", "State code extracted as 29");
assert(gstinKarnataka.stateName === "Karnataka", "State resolved to Karnataka");

const gstinMaharashtra = parseGSTIN("27AABCC1234F1Z5");
assert(gstinMaharashtra.valid === true && gstinMaharashtra.stateName === "Maharashtra", "State resolved to Maharashtra");

const gstinInvalid = parseGSTIN("INVALID123");
assert(gstinInvalid.valid === false, "Invalid GSTIN correctly flagged as false");

// 3. TDS 194J & 206AA Penalty Calculation
console.log("\n--- 3. Testing TDS Rules Engine ---");
assert(TDS_SECTIONS_MASTER["194J"].rates["Technical Services / BPO / Call Center"] === 2.0, "194J Technical Services rate is 2%");
assert(TDS_SECTIONS_MASTER["194J"].rates["Professional Services / Royalty / Non-Compete"] === 10.0, "194J Professional Services rate is 10%");
assert(TDS_SECTIONS_MASTER["194C"].rates["Individual/HUF"] === 1.0, "194C Individual contractor rate is 1%");

// 4. Income Tax Slabs Comparison (FY 24-25 Budget Sec 115BAC)
console.log("\n--- 4. Testing Income Tax Slabs Engine (Budget FY 24-25) ---");
const tax15L = calculateTaxRegimes(1500000, 250000);
assert(tax15L.newRegime.standardDeduction === 75000, "New Regime standard deduction is ₹75,000");
assert(tax15L.oldRegime.standardDeduction === 50000, "Old Regime standard deduction is ₹50,000");
assert(tax15L.newRegime.totalTax < tax15L.oldRegime.totalTax, "New Regime is more beneficial than Old Regime for ₹15L income");

const tax7L = calculateTaxRegimes(700000, 0);
assert(tax7L.newRegime.totalTax === 0, "Section 87A rebate results in ₹0 tax up to ₹7 Lakhs taxable income in New Regime");

// 5. Schedule III Balance Sheet Equation Verification
console.log("\n--- 5. Testing Schedule III Balance Sheet Balancing ---");
const data = DEFAULT_SCHEDULE_III_DATA;
const eq = data.equityAndLiabilities;
const as = data.assets;

const totalLiab = eq.shareholdersFunds.shareCapital + eq.shareholdersFunds.reservesAndSurplus +
  eq.nonCurrentLiabilities.longTermBorrowings + eq.nonCurrentLiabilities.deferredTaxLiabilities +
  eq.currentLiabilities.tradePayables + eq.currentLiabilities.otherCurrentLiabilities +
  (eq.currentLiabilities.dutiesAndTaxesPayable.gstPayableNet + eq.currentLiabilities.dutiesAndTaxesPayable.tdsPayable + eq.currentLiabilities.dutiesAndTaxesPayable.advanceTaxAdjustment) +
  eq.currentLiabilities.shortTermProvisions;

const totalAssets = as.nonCurrentAssets.propertyPlantEquipment + as.nonCurrentAssets.intangibleAssets +
  as.nonCurrentAssets.deferredTaxAssets + as.nonCurrentAssets.longTermLoansAndAdvances +
  as.currentAssets.inventories + as.currentAssets.tradeReceivables + as.currentAssets.cashAndBankBalances +
  (as.currentAssets.inputTaxCreditBalance.itcCGST + as.currentAssets.inputTaxCreditBalance.itcSGST + as.currentAssets.inputTaxCreditBalance.itcIGST) +
  as.currentAssets.shortTermLoansAndAdvances;

assert(Math.abs(totalLiab - totalAssets) < 1, `Balance Sheet is perfectly balanced! Liabilities: ₹${totalLiab}, Assets: ₹${totalAssets}`);

// 6. HTTP Server Endpoint Health Checks
console.log("\n--- 6. Testing HTTP Server Endpoints ---");
function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      assert(res.statusCode === 200, `GET ${path} returned status ${res.statusCode}`);
      resolve();
    }).on('error', (err) => {
      assert(false, `GET ${path} failed: ${err.message}`);
      resolve();
    });
  });
}

await checkEndpoint('/');
await checkEndpoint('/style.css');
await checkEndpoint('/app.js');
await checkEndpoint('/sample_data.js');

console.log("\n=================================================");
console.log(`TEST RUN FINISHED: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) process.exit(1);
else process.exit(0);
