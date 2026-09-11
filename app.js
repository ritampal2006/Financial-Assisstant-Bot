// FinCopilot India - Main Application Controller & Indian Tax Computational Logic
import { 
  INDIAN_STATE_GST_CODES, 
  HSN_SAC_DIRECTORY, 
  TDS_SECTIONS_MASTER, 
  SAMPLE_INVOICES, 
  DEFAULT_SCHEDULE_III_DATA, 
  FREQUENT_TAX_QUESTIONS 
} from './sample_data.js';

// Application State
const State = {
  theme: 'dark',
  scheduleIII: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE_III_DATA)),
  invoices: JSON.parse(JSON.stringify(SAMPLE_INVOICES)),
  activeInvoiceIndex: 0,
  activeTab: 'tab-copilot',
  activeGstrTab: 'gstr1-tab',
  activeStatementSubtab: 'subtab-bs',
  chatHistory: []
};

// Formatting Utilities for Indian Financials (₹ Lakhs, Crores, Standard)
export function formatINR(val, decimals = 2) {
  if (isNaN(val) || val === null) return '₹0.00';
  const num = Number(val);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  // Standard Indian numbering (e.g. 12,50,000.00)
  const parts = absNum.toFixed(decimals).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';

  if (integerPart.length > 3) {
    const last3 = integerPart.substring(integerPart.length - 3);
    const rest = integerPart.substring(0, integerPart.length - 3);
    const regex = /(\d+?)(?=(\d{2})+$)/g;
    integerPart = rest.replace(regex, '$1,') + ',' + last3;
  }
  
  return (isNegative ? '-₹' : '₹') + integerPart + decimalPart;
}

// 15-Digit GSTIN Validation & State Code Resolver
export function parseGSTIN(gstin) {
  if (!gstin || typeof gstin !== 'string') return { valid: false, state: 'Unknown' };
  const clean = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const valid = regex.test(clean);
  const stateCode = clean.substring(0, 2);
  const pan = clean.substring(2, 12);
  const stateName = INDIAN_STATE_GST_CODES[stateCode] || 'Unknown State';
  
  return {
    valid,
    cleanGstin: clean,
    stateCode,
    stateName,
    pan
  };
}

// =========================================================================
// 1. FINCOPILOT AI NATURAL LANGUAGE RULES & COMPUTATIONAL ENGINE
// =========================================================================
export function processCopilotQuery(rawQuery) {
  const query = rawQuery.trim().toLowerCase();

  // 1. Direct GST computation matching (e.g., "Calculate GST on ₹10,000 IT consulting invoice")
  const numMatch = query.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]+)?)/i);
  let parsedAmount = 10000;
  if (numMatch && numMatch[1]) {
    const cleanNum = parseFloat(numMatch[1].replace(/,/g, ''));
    if (!isNaN(cleanNum) && cleanNum > 0) parsedAmount = cleanNum;
  }

  if (query.includes('gst') || query.includes('consulting') || query.includes('invoice')) {
    let rate = 18;
    if (query.includes('5%') || query.includes('freight') || query.includes('gta')) rate = 5;
    else if (query.includes('12%')) rate = 12;
    else if (query.includes('28%') || query.includes('car') || query.includes('luxury')) rate = 28;
    else if (query.includes('0%') || query.includes('nil') || query.includes('exempt')) rate = 0;

    const cgst = (parsedAmount * (rate / 2)) / 100;
    const sgst = (parsedAmount * (rate / 2)) / 100;
    const igst = (parsedAmount * rate) / 100;
    const totalIntra = parsedAmount + cgst + sgst;

    return {
      text: `📊 <strong>GST Computation (${rate}% Slab for IT / Consulting):</strong>
<ul style="margin-top: 6px; margin-bottom: 8px; line-height: 1.6;">
  <li><strong>Taxable Base Value:</strong> ${formatINR(parsedAmount)}</li>
  <li><strong>CGST (${rate/2}%):</strong> ${formatINR(cgst)}</li>
  <li><strong>SGST (${rate/2}%):</strong> ${formatINR(sgst)}</li>
  <li><strong>Total Invoice Amount:</strong> <span class="text-emerald font-bold">${formatINR(totalIntra)}</span></li>
  <li><em>(For Inter-State Supply: IGST (${rate}%) = ${formatINR(igst)})</em></li>
</ul>
✅ <strong>GSTR-1 & Input Tax Credit Note:</strong> Auto-formatted for GSTR-1 Table 4 (B2B) filing. As per Section 16 of CGST Act, full ITC of ${formatINR(cgst + sgst)} can be claimed against output tax liabilities.`,
      calcCard: {
        title: `GST Breakdown: ${formatINR(parsedAmount)} @ ${rate}%`,
        items: [
          { label: 'Taxable Amount', val: formatINR(parsedAmount) },
          { label: `CGST (${rate/2}%)`, val: formatINR(cgst) },
          { label: `SGST (${rate/2}%)`, val: formatINR(sgst) },
          { label: 'Total Invoice Value', val: formatINR(totalIntra), highlight: true }
        ]
      }
    };
  }

  // 2. TDS Section 194J Query
  if (query.includes('194j') || query.includes('professional') || query.includes('technical')) {
    return {
      text: `📑 <strong>TDS Section 194J Guidelines (FY 2024-25):</strong>
<ul style="margin-top: 6px; margin-bottom: 8px; line-height: 1.6;">
  <li><strong>Technical Services / BPO / Call Center:</strong> <span class="text-emerald font-bold">2%</span> (Reduced rate under Finance Act)</li>
  <li><strong>Professional Services (CAs, Lawyers, Doctors, Architects, Royalties):</strong> <span class="text-emerald font-bold">10%</span></li>
  <li><strong>Threshold Exemption Limit:</strong> ₹30,000 in a single financial year.</li>
  <li><strong>Section 206AA Caution:</strong> If payee does not furnish valid PAN, deduct flat <strong>20%</strong>.</li>
</ul>
💡 <em>Accounting Entry:</em> Debit Professional Fees A/c, Credit TDS Payable u/s 194J A/c, Credit Vendor A/c.`
    };
  }

  // 3. New vs Old Tax Regime Comparison
  if (query.includes('regime') || query.includes('slab') || query.includes('salary') || query.includes('income tax')) {
    const salary = parsedAmount >= 100000 ? parsedAmount : 1500000;
    const comparison = calculateTaxRegimes(salary, 250000);
    return {
      text: `⚖️ <strong>Income Tax Regime Comparison for ${formatINR(salary)} (FY 2024-25):</strong>
<ul style="margin-top: 6px; margin-bottom: 8px; line-height: 1.6;">
  <li><strong>New Tax Regime (Sec 115BAC):</strong> Tax Payable: <strong class="text-emerald">${formatINR(comparison.newRegime.totalTax)}</strong> (Standard Deduction ₹75,000 applied).</li>
  <li><strong>Old Tax Regime:</strong> Tax Payable: <strong>${formatINR(comparison.oldRegime.totalTax)}</strong> (Assuming ₹2.5L deductions under 80C/80D/HRA).</li>
  <li><strong>Verdict:</strong> <span class="text-emerald font-bold">${comparison.verdict}</span></li>
</ul>
💡 <em>Note:</em> In FY 24-25 Budget, taxable income up to ₹7,00,000 has ZERO tax under Section 87A rebate.`,
      calcCard: {
        title: `Tax Comparison (${formatINR(salary)})`,
        items: [
          { label: 'New Regime Tax (Sec 115BAC)', val: formatINR(comparison.newRegime.totalTax) },
          { label: 'Old Regime Tax', val: formatINR(comparison.oldRegime.totalTax) },
          { label: 'Net Tax Savings', val: formatINR(Math.abs(comparison.oldRegime.totalTax - comparison.newRegime.totalTax)), highlight: true }
        ]
      }
    };
  }

  // 4. Advance Tax Installments
  if (query.includes('advance tax') || query.includes('234b') || query.includes('234c') || query.includes('installment')) {
    return {
      text: `📅 <strong>Indian Advance Tax Due Dates & Rules (Section 208):</strong>
Advance tax is mandatory if total estimated tax liability exceeds ₹10,000 in FY.
<ol style="margin-top: 6px; margin-bottom: 8px; line-height: 1.6; padding-left: 1.2rem;">
  <li><strong>15th June:</strong> Minimum 15% of total tax liability</li>
  <li><strong>15th September:</strong> Minimum 45% (cumulative)</li>
  <li><strong>15th December:</strong> Minimum 75% (cumulative)</li>
  <li><strong>15th March:</strong> 100% of tax liability</li>
</ol>
⚠️ <em>Penalties:</em> Section 234C charges 1% per month for deferment of installment; Section 234B charges 1% per month if less than 90% of tax is paid before March 31.`
    };
  }

  // 5. GSTR-2B ITC Matching
  if (query.includes('2b') || query.includes('reconciliation') || query.includes('itc') || query.includes('36(4)')) {
    return {
      text: `🔄 <strong>GSTR-2B vs Purchase Register ITC Reconciliation:</strong>
Under Rule 36(4) of CGST Rules, Input Tax Credit (ITC) can only be availed if the invoice is reflected in GSTR-2B generated on the 14th of every month.
<ul style="margin-top: 6px; margin-bottom: 8px; line-height: 1.6;">
  <li><strong>Matched:</strong> Invoice exists in both Books & GSTR-2B -> 100% Eligible ITC.</li>
  <li><strong>Mismatch:</strong> GSTIN or Tax difference -> Supplier must file GSTR-1 amendment.</li>
  <li><strong>Missing:</strong> In Books but not in GSTR-2B -> Credit deferred until supplier files return.</li>
  <li><strong>Blocked Credits (Section 17(5)):</strong> Food, cabs, personal expenses ineligible for ITC.</li>
</ul>`
    };
  }

  // 6. Laptop / Asset Journal Entry
  if (query.includes('laptop') || query.includes('asset') || query.includes('journal') || query.includes('dell')) {
    return {
      text: `💼 <strong>Double Entry Journal Voucher for Fixed Asset (Laptop) Purchase:</strong>
<pre style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-top: 6px;">
Dr Computer Hardware & Peripherals A/c   ₹2,40,000.00
Dr Input Tax Credit - CGST A/c            ₹21,600.00
Dr Input Tax Credit - SGST A/c            ₹21,600.00
    Cr Dell India Pvt Ltd (Vendor) A/c    ₹2,83,200.00
(Being purchase of Dell Laptops capitalized under Schedule III Non-Current Assets)
</pre>
✅ Under Schedule III, this is capitalized under Property, Plant & Equipment and depreciated at 33.33% (SLM) under Companies Act 2013.`
    };
  }

  // Default fallback response
  return {
    text: `🙏 <strong>Namaste!</strong> I have analyzed your query regarding <em>"${rawQuery}"</em>.
<br><br>
You can ask me to:
1. <strong>Calculate GST:</strong> e.g. <em>"Calculate GST on ₹50,000 cloud hosting invoice"</em>
2. <strong>TDS Slabs:</strong> e.g. <em>"TDS 194J rate for technical services"</em>
3. <strong>Tax Regimes:</strong> e.g. <em>"Compare New vs Old Tax Regime for ₹15 Lakh income"</em>
4. <strong>Advance Tax:</strong> e.g. <em>"Advance tax dates for FY 2024-25"</em>
5. <strong>Balance Sheet:</strong> Navigate to the <strong>Schedule III Balance Sheet</strong> tab above to view and export the real-time financial statements.`
  };
}

// =========================================================================
// 2. INCOME TAX SLAB CALCULATOR (FY 24-25 / 25-26 NEW VS OLD REGIME)
// =========================================================================
export function calculateTaxRegimes(grossIncome, oldDeductions = 250000) {
  const gross = Math.max(0, Number(grossIncome) || 0);
  
  // --- NEW REGIME (Section 115BAC - Budget 2024 updates) ---
  // Standard Deduction: ₹75,000
  const newStdDed = Math.min(75000, gross);
  const newTaxable = Math.max(0, gross - newStdDed);

  let newTax = 0;
  // Slabs:
  // 0 to 3L: 0%
  // 3L to 7L: 5%
  // 7L to 10L: 10%
  // 10L to 12L: 15%
  // 12L to 15L: 20%
  // > 15L: 30%
  if (newTaxable > 1500000) {
    newTax += (newTaxable - 1500000) * 0.30;
    newTax += (1500000 - 1200000) * 0.20;
    newTax += (1200000 - 1000000) * 0.15;
    newTax += (1000000 - 700000) * 0.10;
    newTax += (700000 - 300000) * 0.05;
  } else if (newTaxable > 1200000) {
    newTax += (newTaxable - 1200000) * 0.20;
    newTax += (1200000 - 1000000) * 0.15;
    newTax += (1000000 - 700000) * 0.10;
    newTax += (700000 - 300000) * 0.05;
  } else if (newTaxable > 1000000) {
    newTax += (newTaxable - 1000000) * 0.15;
    newTax += (1000000 - 700000) * 0.10;
    newTax += (700000 - 300000) * 0.05;
  } else if (newTaxable > 700000) {
    newTax += (newTaxable - 700000) * 0.10;
    newTax += (700000 - 300000) * 0.05;
  } else if (newTaxable > 300000) {
    newTax += (newTaxable - 300000) * 0.05;
  }

  // 87A Rebate in New Regime (Up to ₹7,00,000 taxable income => zero tax)
  if (newTaxable <= 700000) {
    newTax = 0;
  }

  const newCess = newTax * 0.04;
  const newTotalTax = newTax + newCess;

  // --- OLD REGIME ---
  // Standard Deduction: ₹50,000 + 80C/80D/HRA deductions
  const oldStdDed = Math.min(50000, gross);
  const oldTotalDeductions = oldStdDed + Math.max(0, Number(oldDeductions) || 0);
  const oldTaxable = Math.max(0, gross - oldTotalDeductions);

  let oldTax = 0;
  // Slabs:
  // 0 to 2.5L: 0%
  // 2.5L to 5L: 5%
  // 5L to 10L: 20%
  // > 10L: 30%
  if (oldTaxable > 1000000) {
    oldTax += (oldTaxable - 1000000) * 0.30;
    oldTax += (1000000 - 500000) * 0.20;
    oldTax += (500000 - 250000) * 0.05;
  } else if (oldTaxable > 500000) {
    oldTax += (oldTaxable - 500000) * 0.20;
    oldTax += (500000 - 250000) * 0.05;
  } else if (oldTaxable > 250000) {
    oldTax += (oldTaxable - 250000) * 0.05;
  }

  // 87A Rebate in Old Regime (Up to ₹5,00,000 taxable income)
  if (oldTaxable <= 500000) {
    oldTax = 0;
  }

  const oldCess = oldTax * 0.04;
  const oldTotalTax = oldTax + oldCess;

  let verdict = '';
  if (newTotalTax < oldTotalTax) {
    verdict = `New Tax Regime saves you ${formatINR(oldTotalTax - newTotalTax)} in taxes!`;
  } else if (oldTotalTax < newTotalTax) {
    verdict = `Old Tax Regime saves you ${formatINR(newTotalTax - oldTotalTax)} (due to high ₹${formatINR(oldDeductions)} deductions)!`;
  } else {
    verdict = `Both regimes result in identical tax liability of ${formatINR(newTotalTax)}.`;
  }

  return {
    gross,
    newRegime: {
      standardDeduction: newStdDed,
      taxableIncome: newTaxable,
      baseTax: newTax,
      cess: newCess,
      totalTax: newTotalTax
    },
    oldRegime: {
      standardDeduction: oldStdDed,
      otherDeductions: oldDeductions,
      taxableIncome: oldTaxable,
      baseTax: oldTax,
      cess: oldCess,
      totalTax: oldTotalTax
    },
    verdict
  };
}

// =========================================================================
// 3. UI RENDERERS & EVENT HANDLERS
// =========================================================================

// Initialize UI in browser environment
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initTheme();
    initQuickPrompts();
    initGstCalculator();
    initTdsCalculator();
    initTaxSlabs();
    initOcrParser();
    initScheduleIII();
    initGstrHub();
    initN8nSimulator();
    initPhoneBot();
    initModals();

    // Show welcome toast
    showToast('FinCopilot Indian Financial Agent initialized (FY 2024-25 Ready)', 'success');
  });
}

// Toast notification
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info');
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Navigation Tabs Setup
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      State.activeTab = tabId;

      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(tabId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

// Theme Switcher
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  themeToggleBtn.addEventListener('click', () => {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', State.theme);
    themeToggleBtn.innerHTML = State.theme === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    showToast(`Switched to ${State.theme} theme`, 'info');
  });

  // Reset Demo Data
  const resetBtn = document.getElementById('sampleDataResetBtn');
  resetBtn.addEventListener('click', () => {
    State.scheduleIII = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE_III_DATA));
    State.invoices = JSON.parse(JSON.stringify(SAMPLE_INVOICES));
    State.activeInvoiceIndex = 0;
    renderScheduleIII();
    renderOcrInvoice(0);
    renderGstr1();
    renderGstr2b();
    renderGstr3b();
    showToast('Demo accounting datasets restored to FY 2024-25 baseline', 'success');
  });
}

// Quick Prompt Chips in Chat
function initQuickPrompts() {
  const container = document.getElementById('quickPromptsContainer');
  if (!container) return;
  container.innerHTML = '';

  FREQUENT_TAX_QUESTIONS.forEach(item => {
    const chip = document.createElement('button');
    chip.className = 'prompt-chip';
    chip.innerHTML = `<i class="fa-regular fa-comment-dots text-accent"></i> ${item.label}`;
    chip.addEventListener('click', () => {
      handleChatSubmission(item.query);
    });
    container.appendChild(chip);
  });

  // Chat Form Submit
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const quickDownloadSampleCsv = document.getElementById('quickDownloadSampleCsv');
  const quickDownloadGstJson = document.getElementById('quickDownloadGstJson');
  const chatVoiceBtn = document.getElementById('chatVoiceBtn');
  const chatAttachBtn = document.getElementById('chatAttachBtn');
  const chatFileInput = document.getElementById('chatFileInput');

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;
    handleChatSubmission(query);
    chatInput.value = '';
  });

  clearChatBtn.addEventListener('click', () => {
    const stream = document.getElementById('chatMessagesStream');
    stream.innerHTML = `
      <div class="message-bubble bot-message">
        <div class="message-avatar"><i class="fa-solid fa-brain"></i></div>
        <div class="message-body">
          <div class="message-sender">FinCopilot India</div>
          <div class="message-content">
            <p>👋 Chat cleared! How can I assist you with Indian accounting or tax rules today?</p>
          </div>
          <div class="message-time">Just now</div>
        </div>
      </div>
    `;
    showToast('Chat history cleared', 'info');
  });

  // Voice Simulation
  chatVoiceBtn.addEventListener('click', () => {
    showToast('🎙️ Listening... (Voice query simulation: "Calculate GST on ₹10,000 invoice")', 'info');
    setTimeout(() => {
      chatInput.value = "Calculate GST on ₹10,000 IT consulting invoice";
      handleChatSubmission(chatInput.value);
      chatInput.value = '';
    }, 1200);
  });

  // Chat Attachment
  chatAttachBtn.addEventListener('click', () => chatFileInput.click());
  chatFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      showToast(`📎 File attached: ${file.name} - Parsing through OCR engine...`, 'success');
      handleChatSubmission(`Parse and verify receipt: ${file.name}`);
      // Switch to OCR tab
      document.getElementById('tabBtnOcr').click();
    }
  });

  // Direct CSV download
  quickDownloadSampleCsv.addEventListener('click', exportSampleCsv);
  quickDownloadGstJson.addEventListener('click', exportGstr1Json);

  // Bind any dynamic in-chat chips
  document.addEventListener('click', (e) => {
    if (e.target.closest('.quick-chip')) {
      const chip = e.target.closest('.quick-chip');
      const q = chip.getAttribute('data-query');
      if (q) handleChatSubmission(q);
    }
  });
}

function handleChatSubmission(queryText) {
  const stream = document.getElementById('chatMessagesStream');
  
  // 1. Append User Message
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const userBubble = document.createElement('div');
  userBubble.className = 'message-bubble user-message';
  userBubble.innerHTML = `
    <div class="message-avatar"><i class="fa-solid fa-user"></i></div>
    <div class="message-body">
      <div class="message-sender">You</div>
      <div class="message-content"><p>${escapeHtml(queryText)}</p></div>
      <div class="message-time">${nowTime}</div>
    </div>
  `;
  stream.appendChild(userBubble);
  stream.scrollTop = stream.scrollHeight;

  // 2. Generate Bot Response
  setTimeout(() => {
    const result = processCopilotQuery(queryText);
    const botBubble = document.createElement('div');
    botBubble.className = 'message-bubble bot-message';
    
    let calcCardHtml = '';
    if (result.calcCard) {
      const itemsHtml = result.calcCard.items.map(it => `
        <div class="calc-breakdown-row ${it.highlight ? 'total-row' : ''}">
          <span>${it.label}</span>
          <span class="calc-val">${it.val}</span>
        </div>
      `).join('');
      calcCardHtml = `
        <div class="chat-calc-card">
          <div class="chat-calc-title"><i class="fa-solid fa-bolt"></i> ${result.calcCard.title}</div>
          ${itemsHtml}
        </div>
      `;
    }

    botBubble.innerHTML = `
      <div class="message-avatar"><i class="fa-solid fa-brain"></i></div>
      <div class="message-body">
        <div class="message-sender">FinCopilot India</div>
        <div class="message-content">
          ${result.text}
          ${calcCardHtml}
        </div>
        <div class="message-time">${nowTime}</div>
      </div>
    `;
    stream.appendChild(botBubble);
    stream.scrollTop = stream.scrollHeight;
  }, 400);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

// =========================================================================
// 4. GST CALCULATOR INTERACTIVE MODULE
// =========================================================================
function initGstCalculator() {
  const taxableInput = document.getElementById('gstTaxableAmount');
  const rateSelect = document.getElementById('gstRateSelect');
  const supplySelect = document.getElementById('gstSupplyType');
  const hsnSelect = document.getElementById('gstHsnSelect');
  const rcmCheckbox = document.getElementById('gstRcmCheckbox');
  const copyBtn = document.getElementById('copyGstCalcBtn');
  const postBtn = document.getElementById('postGstToLedgerBtn');

  // Populate HSN Dropdown
  HSN_SAC_DIRECTORY.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.code;
    opt.innerText = `[${h.type} ${h.code}] ${h.desc.substring(0, 45)}... (${h.gstRate}%)`;
    hsnSelect.appendChild(opt);
  });

  hsnSelect.addEventListener('change', () => {
    const selectedCode = hsnSelect.value;
    const found = HSN_SAC_DIRECTORY.find(x => x.code === selectedCode);
    if (found) {
      rateSelect.value = found.gstRate;
      if (found.desc.includes('RCM')) {
        rcmCheckbox.checked = true;
      } else {
        rcmCheckbox.checked = false;
      }
      renderGstCalculation();
    }
  });

  [taxableInput, rateSelect, supplySelect, rcmCheckbox].forEach(el => {
    el.addEventListener('input', renderGstCalculation);
    el.addEventListener('change', renderGstCalculation);
  });

  copyBtn.addEventListener('click', () => {
    const text = document.getElementById('gstResultBox').innerText;
    navigator.clipboard.writeText(text);
    showToast('GST Breakdown copied to clipboard!', 'success');
  });

  postBtn.addEventListener('click', () => {
    const taxable = parseFloat(taxableInput.value) || 10000;
    const rate = parseFloat(rateSelect.value) || 18;
    const supply = supplySelect.value;
    const isRcm = rcmCheckbox.checked;

    const newInv = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      vendorName: 'Direct GST Calculator Voucher',
      vendorGSTIN: '29AAACP9988E1Z4',
      customerGSTIN: '29AABBD5678M1Z2',
      invoiceNumber: `CALC/${Date.now().toString().slice(-4)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      hsnSac: hsnSelect.value === 'custom' ? '998311' : hsnSelect.value,
      description: 'Consulting / Commercial Supplies',
      taxableAmount: taxable,
      gstRate: rate,
      gstType: supply === 'intra' ? 'CGST+SGST' : 'IGST',
      igst: supply === 'inter' ? (taxable * rate) / 100 : 0,
      cgst: supply === 'intra' ? (taxable * (rate / 2)) / 100 : 0,
      sgst: supply === 'intra' ? (taxable * (rate / 2)) / 100 : 0,
      totalAmount: taxable + ((taxable * rate) / 100),
      tdsSection: 'None',
      tdsRate: 0,
      tdsAmount: 0,
      netPayable: taxable + ((taxable * rate) / 100),
      category: 'Professional & Legal Fees',
      status: isRcm ? 'RCM Applicable' : 'Verified',
      journalEntry: {
        debit: [
          { account: 'Professional Consulting Expense A/c', amount: taxable },
          { account: supply === 'intra' ? 'Input Tax Credit - CGST A/c' : 'Input Tax Credit - IGST A/c', amount: (taxable * (rate / (supply === 'intra' ? 2 : 1))) / 100 }
        ],
        credit: [
          { account: 'Sundry Creditors A/c', amount: taxable + ((taxable * rate) / 100) }
        ]
      }
    };

    State.invoices.unshift(newInv);
    renderScheduleIII();
    renderGstr1();
    showToast('New GST Voucher posted to accounting ledger & GSTR-1 register!', 'success');
  });

  renderGstCalculation();
}

function renderGstCalculation() {
  const taxable = parseFloat(document.getElementById('gstTaxableAmount').value) || 0;
  const rate = parseFloat(document.getElementById('gstRateSelect').value) || 0;
  const supply = document.getElementById('gstSupplyType').value;
  const isRcm = document.getElementById('gstRcmCheckbox').checked;

  const totalGst = (taxable * rate) / 100;
  const cgst = supply === 'intra' ? totalGst / 2 : 0;
  const sgst = supply === 'intra' ? totalGst / 2 : 0;
  const igst = supply === 'inter' ? totalGst : 0;
  const invoiceTotal = isRcm ? taxable : (taxable + totalGst);

  const container = document.getElementById('gstResultBox');
  container.innerHTML = `
    <div class="calc-breakdown-row">
      <span>Taxable Value:</span>
      <span class="calc-val">${formatINR(taxable)}</span>
    </div>
    ${supply === 'intra' ? `
      <div class="calc-breakdown-row">
        <span>CGST (${rate/2}%):</span>
        <span class="calc-val">${formatINR(cgst)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>SGST (${rate/2}%):</span>
        <span class="calc-val">${formatINR(sgst)}</span>
      </div>
    ` : `
      <div class="calc-breakdown-row">
        <span>IGST (${rate}%):</span>
        <span class="calc-val">${formatINR(igst)}</span>
      </div>
    `}
    <div class="calc-breakdown-row">
      <span>Total GST Tax (${rate}%):</span>
      <span class="calc-val font-bold text-accent">${formatINR(totalGst)}</span>
    </div>
    ${isRcm ? `
      <div class="calc-breakdown-row" style="color: var(--color-saffron);">
        <span>Reverse Charge (RCM):</span>
        <span class="calc-val">Paid by Recipient directly to Govt</span>
      </div>
    ` : ''}
    <div class="calc-breakdown-row total-row">
      <span>Total Invoice Value:</span>
      <span class="calc-val">${formatINR(invoiceTotal)}</span>
    </div>
  `;
}

// =========================================================================
// 5. TDS CALCULATOR MODULE
// =========================================================================
function initTdsCalculator() {
  const sectionSelect = document.getElementById('tdsSectionSelect');
  const payeeSelect = document.getElementById('tdsPayeeType');
  const grossInput = document.getElementById('tdsGrossAmount');
  const noPanCheckbox = document.getElementById('tdsNoPanCheckbox');
  const copyBtn = document.getElementById('copyTdsCalcBtn');
  const postBtn = document.getElementById('postTdsToLedgerBtn');

  function updatePayeeOptions() {
    const sec = sectionSelect.value;
    const master = TDS_SECTIONS_MASTER[sec];
    payeeSelect.innerHTML = '';
    if (master) {
      Object.keys(master.rates).forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.innerText = `${k} (${master.rates[k]}%)`;
        payeeSelect.appendChild(opt);
      });
    }
    renderTdsCalculation();
  }

  sectionSelect.addEventListener('change', updatePayeeOptions);
  [payeeSelect, grossInput, noPanCheckbox].forEach(el => {
    el.addEventListener('input', renderTdsCalculation);
    el.addEventListener('change', renderTdsCalculation);
  });

  copyBtn.addEventListener('click', () => {
    const text = document.getElementById('tdsResultBox').innerText;
    navigator.clipboard.writeText(text);
    showToast('TDS summary copied to clipboard!', 'success');
  });

  postBtn.addEventListener('click', () => {
    showToast('TDS deduction voucher posted to Schedule III Duties & Taxes Payable', 'success');
  });

  updatePayeeOptions();
}

function renderTdsCalculation() {
  const sec = document.getElementById('tdsSectionSelect').value;
  const payee = document.getElementById('tdsPayeeType').value;
  const gross = parseFloat(document.getElementById('tdsGrossAmount').value) || 0;
  const noPan = document.getElementById('tdsNoPanCheckbox').checked;

  const master = TDS_SECTIONS_MASTER[sec];
  let rate = master && master.rates[payee] !== undefined ? master.rates[payee] : 2;
  if (noPan) rate = 20; // Sec 206AA penalty rate

  const tdsAmount = (gross * rate) / 100;
  const netPayable = gross - tdsAmount;

  const container = document.getElementById('tdsResultBox');
  container.innerHTML = `
    <div class="calc-breakdown-row">
      <span>Section & Description:</span>
      <span class="calc-val">${sec} - ${master ? master.name : ''}</span>
    </div>
    <div class="calc-breakdown-row">
      <span>Gross Payable:</span>
      <span class="calc-val">${formatINR(gross)}</span>
    </div>
    <div class="calc-breakdown-row">
      <span>Applicable TDS Rate:</span>
      <span class="calc-val ${noPan ? 'text-danger font-bold' : 'text-accent'}">${rate}% ${noPan ? '(206AA Penalty)' : ''}</span>
    </div>
    <div class="calc-breakdown-row">
      <span>TDS to Deduct & Deposit by 7th:</span>
      <span class="calc-val text-danger font-bold">${formatINR(tdsAmount)}</span>
    </div>
    <div class="calc-breakdown-row total-row">
      <span>Net Amount Payable to Payee:</span>
      <span class="calc-val">${formatINR(netPayable)}</span>
    </div>
    <div class="text-xs text-muted mt-2">
      <i class="fa-solid fa-circle-info"></i> <strong>Threshold:</strong> ${master ? master.threshold : ''}
    </div>
  `;
}

// =========================================================================
// 6. TAX SLABS & ADVANCE TAX MODULE
// =========================================================================
function initTaxSlabs() {
  const salaryInput = document.getElementById('incomeGrossSalary');
  const deductionsInput = document.getElementById('incomeDeductionsOld');
  const recalcBtn = document.getElementById('recalcTaxSlabsBtn');

  recalcBtn.addEventListener('click', renderTaxSlabsComparison);
  [salaryInput, deductionsInput].forEach(el => {
    el.addEventListener('input', renderTaxSlabsComparison);
  });

  renderTaxSlabsComparison();
  renderAdvanceTaxSchedule();
}

function renderTaxSlabsComparison() {
  const salary = parseFloat(document.getElementById('incomeGrossSalary').value) || 1500000;
  const deductions = parseFloat(document.getElementById('incomeDeductionsOld').value) || 250000;

  const res = calculateTaxRegimes(salary, deductions);
  const container = document.getElementById('taxComparisonResults');

  const isNewBetter = res.newRegime.totalTax <= res.oldRegime.totalTax;

  container.innerHTML = `
    <!-- New Regime Card -->
    <div class="regime-card ${isNewBetter ? 'recommended' : ''}">
      <div class="regime-title">
        <span>New Tax Regime (Sec 115BAC)</span>
        ${isNewBetter ? '<span class="badge-tag bg-success-soft"><i class="fa-solid fa-check"></i> Recommended</span>' : ''}
      </div>
      <div class="calc-breakdown-row">
        <span>Gross Annual Income:</span>
        <span class="calc-val">${formatINR(res.gross)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Standard Deduction (Budget 2024):</span>
        <span class="calc-val text-accent">-${formatINR(res.newRegime.standardDeduction)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Net Taxable Income:</span>
        <span class="calc-val">${formatINR(res.newRegime.taxableIncome)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Base Income Tax:</span>
        <span class="calc-val">${formatINR(res.newRegime.baseTax)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Health & Education Cess (4%):</span>
        <span class="calc-val">${formatINR(res.newRegime.cess)}</span>
      </div>
      <div class="calc-breakdown-row total-row">
        <span>Total Tax Liability:</span>
        <span class="calc-val">${formatINR(res.newRegime.totalTax)}</span>
      </div>
    </div>

    <!-- Old Regime Card -->
    <div class="regime-card ${!isNewBetter ? 'recommended' : ''}">
      <div class="regime-title">
        <span>Old Tax Regime</span>
        ${!isNewBetter ? '<span class="badge-tag bg-success-soft"><i class="fa-solid fa-check"></i> Recommended</span>' : ''}
      </div>
      <div class="calc-breakdown-row">
        <span>Gross Annual Income:</span>
        <span class="calc-val">${formatINR(res.gross)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Standard Deduction:</span>
        <span class="calc-val">-${formatINR(res.oldRegime.standardDeduction)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>80C / 80D / HRA Deductions:</span>
        <span class="calc-val text-accent">-${formatINR(res.oldRegime.otherDeductions)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Net Taxable Income:</span>
        <span class="calc-val">${formatINR(res.oldRegime.taxableIncome)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Base Income Tax:</span>
        <span class="calc-val">${formatINR(res.oldRegime.baseTax)}</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Health & Education Cess (4%):</span>
        <span class="calc-val">${formatINR(res.oldRegime.cess)}</span>
      </div>
      <div class="calc-breakdown-row total-row">
        <span>Total Tax Liability:</span>
        <span class="calc-val">${formatINR(res.oldRegime.totalTax)}</span>
      </div>
    </div>
  `;
}

function renderAdvanceTaxSchedule() {
  const totalTaxEst = 510000; // Sample corporate tax
  const scheduleContainer = document.getElementById('advanceTaxScheduleTable');

  const installments = [
    { date: '15th June 2024', pct: '15%', cumulativePct: 15, amt: (totalTaxEst * 0.15) },
    { date: '15th September 2024', pct: '30% (Cum. 45%)', cumulativePct: 45, amt: (totalTaxEst * 0.45) },
    { date: '15th December 2024', pct: '30% (Cum. 75%)', cumulativePct: 75, amt: (totalTaxEst * 0.75) },
    { date: '15th March 2025', pct: '25% (Cum. 100%)', cumulativePct: 100, amt: totalTaxEst }
  ];

  scheduleContainer.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Installment Due Date</th>
          <th>Required Percentage (%)</th>
          <th>Cumulative Tax Payable ₹</th>
          <th>Section Status</th>
        </tr>
      </thead>
      <tbody>
        ${installments.map(ins => `
          <tr>
            <td><strong>${ins.date}</strong></td>
            <td><span class="badge-mini">${ins.pct}</span></td>
            <td class="font-bold text-accent">${formatINR(ins.amt)}</td>
            <td><span class="badge-tag bg-success-soft">Sec 234C Compliant</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// =========================================================================
// 7. RECEIPT OCR & AUTO-LEDGER POSTING MODULE
// =========================================================================
function initOcrParser() {
  const sampleContainer = document.getElementById('sampleInvoiceList');
  const dropzone = document.getElementById('ocrDropzone');
  const browseBtn = document.getElementById('ocrBrowseBtn');
  const fileInput = document.getElementById('ocrFileInput');
  const confirmPostBtn = document.getElementById('confirmPostToLedgerBtn');
  const downloadJsonBtn = document.getElementById('downloadJvJsonBtn');

  // Populate sample invoices
  sampleContainer.innerHTML = '';
  State.invoices.slice(0, 5).forEach((inv, idx) => {
    const item = document.createElement('div');
    item.className = `sample-invoice-item ${idx === State.activeInvoiceIndex ? 'active' : ''}`;
    item.innerHTML = `
      <div>
        <strong>${inv.vendorName}</strong>
        <div class="text-xs text-muted">${inv.invoiceNumber} | ${inv.hsnSac}</div>
      </div>
      <div class="text-right">
        <span class="font-bold text-accent">${formatINR(inv.totalAmount)}</span>
        <div class="text-xs text-muted">${inv.gstType} ${inv.gstRate}%</div>
      </div>
    `;
    item.addEventListener('click', () => {
      document.querySelectorAll('.sample-invoice-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      State.activeInvoiceIndex = idx;
      renderOcrInvoice(idx);
    });
    sampleContainer.appendChild(item);
  });

  // Dropzone drag & drop
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFileUploadOcr(e.dataTransfer.files[0]);
  });

  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFileUploadOcr(e.target.files[0]);
  });

  confirmPostBtn.addEventListener('click', () => {
    const inv = State.invoices[State.activeInvoiceIndex];
    if (inv) {
      showToast(`Voucher for ${inv.invoiceNumber} posted to Schedule III Balance Sheet!`, 'success');
      document.getElementById('tabBtnBalanceSheet').click();
    }
  });

  downloadJsonBtn.addEventListener('click', () => {
    const inv = State.invoices[State.activeInvoiceIndex];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inv, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${inv.invoiceNumber}_voucher.json`);
    dlAnchor.click();
    showToast('Journal Voucher JSON downloaded!', 'success');
  });

  renderOcrInvoice(0);
}

function handleFileUploadOcr(file) {
  showToast(`Simulating Multimodal OCR on "${file.name}"...`, 'info');
  setTimeout(() => {
    const randomAmount = Math.floor(Math.random() * 40000) + 10000;
    const gstin = '29AABCT1234F1Z9';
    const newInv = {
      id: `UPL-${Date.now().toString().slice(-4)}`,
      vendorName: file.name.replace(/\.[^/.]+$/, "").toUpperCase() + ' SUPPLIES',
      vendorGSTIN: gstin,
      customerGSTIN: '29AABBD5678M1Z2',
      invoiceNumber: `UP/${Date.now().toString().slice(-4)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      hsnSac: '998313',
      description: 'Extracted Invoice Line Items from uploaded document',
      taxableAmount: randomAmount,
      gstRate: 18,
      gstType: 'CGST+SGST',
      igst: 0,
      cgst: (randomAmount * 0.09),
      sgst: (randomAmount * 0.09),
      totalAmount: (randomAmount * 1.18),
      tdsSection: '194J',
      tdsRate: 2,
      tdsAmount: (randomAmount * 0.02),
      netPayable: (randomAmount * 1.16),
      category: 'IT Services & Software',
      status: 'OCR Verified',
      journalEntry: {
        debit: [
          { account: 'Software & IT Infrastructure A/c', amount: randomAmount },
          { account: 'Input Tax Credit - CGST A/c', amount: (randomAmount * 0.09) },
          { account: 'Input Tax Credit - SGST A/c', amount: (randomAmount * 0.09) }
        ],
        credit: [
          { account: 'TDS Payable u/s 194J A/c', amount: (randomAmount * 0.02) },
          { account: 'Sundry Creditors A/c', amount: (randomAmount * 1.16) }
        ]
      }
    };

    State.invoices.unshift(newInv);
    State.activeInvoiceIndex = 0;
    initOcrParser();
    renderOcrInvoice(0);
    renderScheduleIII();
    showToast(`Successfully extracted ${formatINR(newInv.totalAmount)} from ${file.name}`, 'success');
  }, 1000);
}

function renderOcrInvoice(index) {
  const inv = State.invoices[index] || State.invoices[0];
  if (!inv) return;

  const parsedGstin = parseGSTIN(inv.vendorGSTIN);

  // 1. Visual Receipt Render
  document.getElementById('receiptPreviewFilename').innerText = `${inv.invoiceNumber}.pdf`;
  const renderBox = document.getElementById('receiptRenderBox');
  renderBox.innerHTML = `
    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between;">
      <div>
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">${inv.vendorName}</h3>
        <div style="font-size: 0.75rem; color: #64748b;">GSTIN: <strong style="color: #0f172a;">${inv.vendorGSTIN}</strong> (${parsedGstin.stateName})</div>
      </div>
      <div style="text-align: right;">
        <span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">TAX INVOICE</span>
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Date: ${inv.invoiceDate}</div>
      </div>
    </div>
    
    <div style="font-size: 0.78rem; margin-bottom: 12px; background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
      <div><strong>Billed To:</strong> Bharat FinTech Innovations Pvt Ltd (GSTIN: ${inv.customerGSTIN})</div>
      <div><strong>Description:</strong> ${inv.description} | SAC/HSN: <strong>${inv.hsnSac}</strong></div>
    </div>

    <table style="width: 100%; font-size: 0.78rem; border-collapse: collapse; margin-bottom: 12px;">
      <tr style="border-bottom: 1px solid #cbd5e1; font-weight: 700;">
        <td style="padding: 4px 0;">Item Particulars</td>
        <td style="text-align: right;">Taxable</td>
        <td style="text-align: right;">GST (${inv.gstRate}%)</td>
        <td style="text-align: right;">Total</td>
      </tr>
      <tr>
        <td style="padding: 6px 0;">${inv.description.substring(0, 30)}...</td>
        <td style="text-align: right;">${formatINR(inv.taxableAmount)}</td>
        <td style="text-align: right;">${formatINR(inv.cgst + inv.sgst + inv.igst)}</td>
        <td style="text-align: right; font-weight: 700;">${formatINR(inv.totalAmount)}</td>
      </tr>
    </table>

    <div style="display: flex; justify-content: flex-end; border-top: 1px solid #cbd5e1; padding-top: 8px;">
      <div style="text-align: right;">
        <div style="font-size: 0.75rem; color: #64748b;">Total Invoice Amount:</div>
        <div style="font-size: 1.15rem; font-weight: 800; color: #047857;">${formatINR(inv.totalAmount)}</div>
      </div>
    </div>
  `;

  // 2. Extracted Fields Grid
  const fieldsContainer = document.getElementById('ocrExtractedFields');
  fieldsContainer.innerHTML = `
    <div class="field-chip">
      <span class="label">Vendor Name</span>
      <span class="value">${inv.vendorName}</span>
    </div>
    <div class="field-chip">
      <span class="label">Vendor GSTIN</span>
      <span class="value text-accent">${inv.vendorGSTIN} (${parsedGstin.stateName})</span>
    </div>
    <div class="field-chip">
      <span class="label">Invoice No. & Date</span>
      <span class="value">${inv.invoiceNumber} (${inv.invoiceDate})</span>
    </div>
    <div class="field-chip">
      <span class="label">HSN / SAC Code</span>
      <span class="value">${inv.hsnSac}</span>
    </div>
    <div class="field-chip">
      <span class="label">Taxable Base</span>
      <span class="value">${formatINR(inv.taxableAmount)}</span>
    </div>
    <div class="field-chip">
      <span class="label">GST Type & Rate</span>
      <span class="value text-accent">${inv.gstType} @ ${inv.gstRate}%</span>
    </div>
    <div class="field-chip">
      <span class="label">TDS Applicable</span>
      <span class="value text-warning">${inv.tdsSection !== 'None' ? `${inv.tdsSection} (${inv.tdsRate}%) = ${formatINR(inv.tdsAmount)}` : 'Nil'}</span>
    </div>
    <div class="field-chip">
      <span class="label">Net Vendor Payable</span>
      <span class="value text-emerald font-bold">${formatINR(inv.netPayable)}</span>
    </div>
  `;

  // 3. Journal Voucher Table
  const jvTbody = document.getElementById('journalVoucherTbody');
  let totalDebit = 0;
  let totalCredit = 0;

  const rows = [];
  inv.journalEntry.debit.forEach(d => {
    totalDebit += d.amount;
    rows.push(`
      <tr>
        <td><strong>${d.account}</strong></td>
        <td><span class="badge-mini text-accent">Debit (Dr)</span></td>
        <td class="font-bold">${formatINR(d.amount)}</td>
        <td>-</td>
      </tr>
    `);
  });

  inv.journalEntry.credit.forEach(c => {
    totalCredit += c.amount;
    rows.push(`
      <tr>
        <td style="padding-left: 2rem;">To ${c.account}</td>
        <td><span class="badge-mini text-warning">Credit (Cr)</span></td>
        <td>-</td>
        <td class="font-bold">${formatINR(c.amount)}</td>
      </tr>
    `);
  });

  jvTbody.innerHTML = rows.join('');
  document.getElementById('jvTotalDebit').innerText = formatINR(totalDebit);
  document.getElementById('jvTotalCredit').innerText = formatINR(totalCredit);
}

// =========================================================================
// 8. SCHEDULE III BALANCE SHEET & P&L STATEMENT
// =========================================================================
function initScheduleIII() {
  const subnavBtns = document.querySelectorAll('.sub-tab-btn');
  const subContents = document.querySelectorAll('.statement-tab-content');

  subnavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-subtab');
      State.activeStatementSubtab = target;

      subnavBtns.forEach(b => b.classList.remove('active'));
      subContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const el = document.getElementById(target);
      if (el) el.classList.add('active');
    });
  });

  // Export buttons
  document.getElementById('btnExportBsExcel').addEventListener('click', exportScheduleIiiExcel);
  document.getElementById('btnExportBsPdf').addEventListener('click', exportScheduleIiiPdf);
  document.getElementById('btnUploadLedgerCsv').addEventListener('click', () => {
    document.getElementById('ledgerCsvFileInput').click();
  });
  document.getElementById('ledgerCsvFileInput').addEventListener('change', (e) => {
    if (e.target.files.length) {
      showToast(`Uploaded ledger batch "${e.target.files[0].name}" successfully parsed!`, 'success');
      renderScheduleIII();
    }
  });

  renderScheduleIII();
}

function renderScheduleIII() {
  const data = State.scheduleIII;
  const eq = data.equityAndLiabilities;
  const as = data.assets;
  const pnl = data.profitLoss;

  // Calculate dynamic totals
  const totalShareholdersFunds = eq.shareholdersFunds.shareCapital + eq.shareholdersFunds.reservesAndSurplus;
  const totalNonCurrentLiab = eq.nonCurrentLiabilities.longTermBorrowings + eq.nonCurrentLiabilities.deferredTaxLiabilities;
  const dutiesAndTaxesTotal = eq.currentLiabilities.dutiesAndTaxesPayable.gstPayableNet + eq.currentLiabilities.dutiesAndTaxesPayable.tdsPayable + eq.currentLiabilities.dutiesAndTaxesPayable.advanceTaxAdjustment;
  const totalCurrentLiab = eq.currentLiabilities.tradePayables + eq.currentLiabilities.otherCurrentLiabilities + dutiesAndTaxesTotal + eq.currentLiabilities.shortTermProvisions;
  const totalLiabilities = totalShareholdersFunds + totalNonCurrentLiab + totalCurrentLiab;

  const totalNonCurrentAssets = as.nonCurrentAssets.propertyPlantEquipment + as.nonCurrentAssets.intangibleAssets + as.nonCurrentAssets.deferredTaxAssets + as.nonCurrentAssets.longTermLoansAndAdvances;
  const itcTotal = as.currentAssets.inputTaxCreditBalance.itcCGST + as.currentAssets.inputTaxCreditBalance.itcSGST + as.currentAssets.inputTaxCreditBalance.itcIGST;
  const totalCurrentAssets = as.currentAssets.inventories + as.currentAssets.tradeReceivables + as.currentAssets.cashAndBankBalances + itcTotal + as.currentAssets.shortTermLoansAndAdvances;
  const totalAssets = totalNonCurrentAssets + totalCurrentAssets;

  // Update Tally Box
  document.getElementById('bsTotalLiabilitiesVal').innerText = formatINR(totalLiabilities);
  document.getElementById('bsTotalAssetsVal').innerText = formatINR(totalAssets);

  const variance = Math.abs(totalLiabilities - totalAssets);
  if (variance < 1) {
    document.getElementById('bsBalanceStatusText').innerText = `Balance Sheet is Perfectly Balanced! (₹0.00 Variance)`;
  } else {
    document.getElementById('bsBalanceStatusText').innerText = `Variance: ${formatINR(variance)}`;
  }

  // 1. Render Liabilities Tbody
  const liabTbody = document.getElementById('scheduleIiLiabilitiesTbody');
  liabTbody.innerHTML = `
    <tr class="schedule-head-row">
      <td colspan="3"><strong>I. EQUITY AND LIABILITIES</strong></td>
    </tr>
    
    <!-- (1) Shareholders' Funds -->
    <tr class="schedule-subhead-row">
      <td colspan="3">(1) Shareholders' Funds</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(a) Share Capital (Authorized: 1,00,000 Equity Shares of ₹10 each)</td>
      <td>Note 1</td>
      <td class="text-right">${formatINR(eq.shareholdersFunds.shareCapital)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(b) Reserves and Surplus (Retained Earnings & P&L Balance)</td>
      <td>Note 2</td>
      <td class="text-right">${formatINR(eq.shareholdersFunds.reservesAndSurplus)}</td>
    </tr>

    <!-- (2) Non-Current Liabilities -->
    <tr class="schedule-subhead-row">
      <td colspan="3">(2) Non-Current Liabilities</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(a) Long-Term Borrowings (Term Loans from Banks)</td>
      <td>Note 3</td>
      <td class="text-right">${formatINR(eq.nonCurrentLiabilities.longTermBorrowings)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(b) Deferred Tax Liabilities (Net)</td>
      <td>Note 4</td>
      <td class="text-right">${formatINR(eq.nonCurrentLiabilities.deferredTaxLiabilities)}</td>
    </tr>

    <!-- (3) Current Liabilities -->
    <tr class="schedule-subhead-row">
      <td colspan="3">(3) Current Liabilities</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(a) Trade Payables (Sundry Creditors for Expenses)</td>
      <td>Note 5</td>
      <td class="text-right">${formatINR(eq.currentLiabilities.tradePayables)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(b) Duties & Taxes Payable (GST Output Net + TDS Payable u/s 194J/C)</td>
      <td>Note 6</td>
      <td class="text-right">${formatINR(dutiesAndTaxesTotal)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(c) Other Current Liabilities & Short-Term Provisions</td>
      <td>Note 7</td>
      <td class="text-right">${formatINR(eq.currentLiabilities.otherCurrentLiabilities + eq.currentLiabilities.shortTermProvisions)}</td>
    </tr>

    <tr class="schedule-total-row">
      <td><strong>TOTAL EQUITY AND LIABILITIES</strong></td>
      <td></td>
      <td class="text-right font-bold text-accent">${formatINR(totalLiabilities)}</td>
    </tr>
  `;

  // 2. Render Assets Tbody
  const assetsTbody = document.getElementById('scheduleIiAssetsTbody');
  assetsTbody.innerHTML = `
    <tr class="schedule-head-row">
      <td colspan="3"><strong>II. ASSETS</strong></td>
    </tr>

    <!-- (1) Non-Current Assets -->
    <tr class="schedule-subhead-row">
      <td colspan="3">(1) Non-Current Assets</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(a) Property, Plant and Equipment (Computers, Hardware & Office Assets)</td>
      <td>Note 8</td>
      <td class="text-right">${formatINR(as.nonCurrentAssets.propertyPlantEquipment)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(b) Intangible Assets (Proprietary AI Software & Licenses)</td>
      <td>Note 9</td>
      <td class="text-right">${formatINR(as.nonCurrentAssets.intangibleAssets)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(c) Deferred Tax Assets & Long-Term Security Deposits</td>
      <td>Note 10</td>
      <td class="text-right">${formatINR(as.nonCurrentAssets.deferredTaxAssets + as.nonCurrentAssets.longTermLoansAndAdvances)}</td>
    </tr>

    <!-- (2) Current Assets -->
    <tr class="schedule-subhead-row">
      <td colspan="3">(2) Current Assets</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(a) Current Inventories</td>
      <td>Note 11</td>
      <td class="text-right">${formatINR(as.currentAssets.inventories)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(b) Trade Receivables (Sundry Debtors < 6 Months)</td>
      <td>Note 12</td>
      <td class="text-right">${formatINR(as.currentAssets.tradeReceivables)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(c) Cash and Bank Balances (HDFC / ICICI Current Accounts)</td>
      <td>Note 13</td>
      <td class="text-right">${formatINR(as.currentAssets.cashAndBankBalances)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(d) Input Tax Credit (ITC) Electronic Credit Ledger (CGST/SGST/IGST)</td>
      <td>Note 14</td>
      <td class="text-right text-emerald">${formatINR(itcTotal)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(e) Short-Term Loans, Advances & Prepayments</td>
      <td>Note 15</td>
      <td class="text-right">${formatINR(as.currentAssets.shortTermLoansAndAdvances)}</td>
    </tr>

    <tr class="schedule-total-row">
      <td><strong>TOTAL ASSETS</strong></td>
      <td></td>
      <td class="text-right font-bold text-accent">${formatINR(totalAssets)}</td>
    </tr>
  `;

  // 3. Render P&L Statement
  const totalRevenue = pnl.revenueFromOperations + pnl.otherIncome;
  const totalExpenses = Object.values(pnl.expenses).reduce((a, b) => a + b, 0);
  const profitBeforeTax = totalRevenue - totalExpenses;
  const netTaxExpense = pnl.taxExpense.currentTax + pnl.taxExpense.deferredTax;
  const profitAfterTax = profitBeforeTax - netTaxExpense;

  const pnlTbody = document.getElementById('scheduleIiiPnlTbody');
  pnlTbody.innerHTML = `
    <tr class="schedule-head-row">
      <td colspan="3"><strong>I. REVENUE</strong></td>
    </tr>
    <tr class="schedule-item-row">
      <td>(a) Revenue from Operations (Software & Consulting Services)</td>
      <td>Note 16</td>
      <td class="text-right">${formatINR(pnl.revenueFromOperations)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(b) Other Income (Interest on Fixed Deposits)</td>
      <td>Note 17</td>
      <td class="text-right">${formatINR(pnl.otherIncome)}</td>
    </tr>
    <tr class="schedule-total-row">
      <td><strong>TOTAL REVENUE (I + II)</strong></td>
      <td></td>
      <td class="text-right font-bold text-accent">${formatINR(totalRevenue)}</td>
    </tr>

    <tr class="schedule-head-row">
      <td colspan="3"><strong>II. EXPENSES</strong></td>
    </tr>
    <tr class="schedule-item-row">
      <td>(a) Employee Benefit Expenses (Salaries & EPF/ESI)</td>
      <td>Note 18</td>
      <td class="text-right">${formatINR(pnl.expenses.employeeBenefitExpenses)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(b) Cloud Hosting, Server & IT Infrastructure Expenses</td>
      <td>Note 19</td>
      <td class="text-right">${formatINR(pnl.expenses.cloudAndITExpenses)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(c) Finance Costs (Interest on Term Loans)</td>
      <td>Note 20</td>
      <td class="text-right">${formatINR(pnl.expenses.financeCosts)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(d) Depreciation and Amortization Expense</td>
      <td>Note 21</td>
      <td class="text-right">${formatINR(pnl.expenses.depreciationAndAmortization)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>(e) Other Operating Expenses (Rent, Legal & Office)</td>
      <td>Note 22</td>
      <td class="text-right">${formatINR(pnl.expenses.rentAndOfficeMaintenance + pnl.expenses.otherOperatingExpenses + pnl.expenses.costOfServicesMaterials)}</td>
    </tr>
    <tr class="schedule-total-row">
      <td><strong>TOTAL EXPENSES</strong></td>
      <td></td>
      <td class="text-right font-bold">${formatINR(totalExpenses)}</td>
    </tr>

    <tr class="schedule-head-row">
      <td><strong>PROFIT BEFORE TAX (PBT)</strong></td>
      <td></td>
      <td class="text-right font-bold text-accent">${formatINR(profitBeforeTax)}</td>
    </tr>
    <tr class="schedule-item-row">
      <td>Less: Current Tax Expense (Corporate Tax @ 25% + Cess)</td>
      <td>Note 23</td>
      <td class="text-right text-danger">-${formatINR(pnl.taxExpense.currentTax)}</td>
    </tr>
    <tr class="schedule-total-row" style="background: rgba(16, 185, 129, 0.15);">
      <td><strong>PROFIT FOR THE PERIOD (PAT)</strong></td>
      <td></td>
      <td class="text-right font-bold text-emerald" style="font-size: 1rem;">${formatINR(profitAfterTax)}</td>
    </tr>
  `;

  // 4. Render Active Ledger Register
  document.getElementById('ledgerCountBadge').innerText = State.invoices.length;
  const ledgerTbody = document.getElementById('activeLedgerTbody');
  ledgerTbody.innerHTML = State.invoices.map((inv, idx) => `
    <tr>
      <td><strong>${inv.invoiceNumber}</strong></td>
      <td>${inv.invoiceDate}</td>
      <td>${inv.vendorName}</td>
      <td><span class="badge-mini">${inv.vendorGSTIN}</span></td>
      <td>${inv.description.substring(0, 25)}...</td>
      <td>${formatINR(inv.taxableAmount)}</td>
      <td>${formatINR(inv.cgst + inv.sgst + inv.igst)}</td>
      <td class="${inv.tdsAmount > 0 ? 'text-warning font-bold' : ''}">${inv.tdsAmount > 0 ? formatINR(inv.tdsAmount) : '-'}</td>
      <td class="font-bold text-accent">${formatINR(inv.totalAmount)}</td>
      <td>
        <button class="btn btn-sm btn-outline delete-txn-btn" data-idx="${idx}" title="Delete Transaction">
          <i class="fa-solid fa-trash-can text-danger"></i>
        </button>
      </td>
    </tr>
  `).join('');

  // Delete transaction action
  document.querySelectorAll('.delete-txn-btn').forEach(b => {
    b.addEventListener('click', () => {
      const idx = parseInt(b.getAttribute('data-idx'));
      State.invoices.splice(idx, 1);
      renderScheduleIII();
      renderGstr1();
      showToast('Transaction removed from ledger', 'info');
    });
  });
}

// =========================================================================
// 9. GSTR FILING & ITC RECONCILIATION HUB
// =========================================================================
function initGstrHub() {
  const navBtns = document.querySelectorAll('.gstr-nav-btn');
  const panels = document.querySelectorAll('.gstr-panel-view');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-gstrtab');
      State.activeGstrTab = target;

      navBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const el = document.getElementById(target);
      if (el) el.classList.add('active');
    });
  });

  document.getElementById('downloadGstr1PortalJson').addEventListener('click', exportGstr1Json);

  renderGstr1();
  renderGstr2b();
  renderGstr3b();
}

function renderGstr1() {
  const tbody = document.getElementById('gstr1TableBody');
  tbody.innerHTML = State.invoices.map(inv => {
    const isInter = inv.gstType.includes('IGST');
    const pos = parseGSTIN(inv.customerGSTIN).stateCode;
    return `
      <tr>
        <td><strong>${inv.customerGSTIN}</strong></td>
        <td>Bharat FinTech Innovations Pvt Ltd</td>
        <td>${inv.invoiceNumber}</td>
        <td>${inv.invoiceDate}</td>
        <td class="font-bold">${formatINR(inv.totalAmount)}</td>
        <td>${pos}-Karnataka</td>
        <td>${inv.gstRate}%</td>
        <td>${formatINR(inv.taxableAmount)}</td>
        <td>${isInter ? formatINR(inv.igst) : '-'}</td>
        <td>${!isInter ? formatINR(inv.cgst) : '-'}</td>
        <td>${!isInter ? formatINR(inv.sgst) : '-'}</td>
      </tr>
    `;
  }).join('');
}

function renderGstr2b() {
  const tbody = document.getElementById('gstr2bTableBody');
  const sampleRecon = [
    { gstin: '27AABCC1234F1Z5', name: 'CloudTech Solutions Pvt Ltd', inv: 'CTS/24-25/0892', bookAmt: 59000, portalAmt: 59000, status: 'Matched (100% Eligible)' },
    { gstin: '29AAKFA4433E1ZQ', name: 'Apex Infosystems LLP', inv: 'APX/BLR/401', bookAmt: 118000, portalAmt: 118000, status: 'Matched (100% Eligible)' },
    { gstin: '29AAGCN9988D1Z4', name: 'Nexus Workspace Real Estate', inv: 'NEXUS/RENT/1124', bookAmt: 76700, portalAmt: 76700, status: 'Matched (100% Eligible)' },
    { gstin: '29AABCD1122C1ZR', name: 'Dell India Computer Solutions', inv: 'DELL-IN-90921', bookAmt: 283200, portalAmt: 283200, status: 'Matched (Capital Goods ITC)' },
    { gstin: '27AABQ8899K1Z3', name: 'QuickLogistics Express Courier', inv: 'QL-EXP-7711', bookAmt: 15000, portalAmt: 0, status: 'Supplier Return Pending' }
  ];

  tbody.innerHTML = sampleRecon.map(r => `
    <tr>
      <td><strong>${r.gstin}</strong></td>
      <td>${r.name}</td>
      <td>${r.inv}</td>
      <td>${formatINR(r.bookAmt)}</td>
      <td>${r.portalAmt > 0 ? formatINR(r.portalAmt) : '<span class="text-danger">Not Uploaded</span>'}</td>
      <td><span class="badge-tag ${r.portalAmt > 0 ? 'bg-success-soft' : 'text-danger'}">${r.portalAmt > 0 ? 'Eligible' : 'Pending'}</span></td>
      <td><span class="badge-mini ${r.portalAmt > 0 ? 'text-accent' : 'text-warning'}">${r.status}</span></td>
    </tr>
  `).join('');
}

function renderGstr3b() {
  const grid = document.getElementById('gstr3bSummaryGrid');
  grid.innerHTML = `
    <div class="card glass-card">
      <div class="card-title text-sm"><i class="fa-solid fa-arrow-trend-up text-accent"></i> 3.1 Details of Outward Supplies (Tax Output Liability)</div>
      <div class="calc-breakdown-row mt-3">
        <span>Total Taxable Turnover:</span>
        <span class="calc-val">₹72,50,000.00</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Integrated Tax (IGST):</span>
        <span class="calc-val">₹6,52,500.00</span>
      </div>
      <div class="calc-breakdown-row">
        <span>Central Tax (CGST):</span>
        <span class="calc-val">₹3,26,250.00</span>
      </div>
      <div class="calc-breakdown-row">
        <span>State Tax (SGST):</span>
        <span class="calc-val">₹3,26,250.00</span>
      </div>
      <div class="calc-breakdown-row total-row">
        <span>Total Output Tax Liability:</span>
        <span class="calc-val text-danger">₹13,05,000.00</span>
      </div>
    </div>

    <div class="card glass-card mt-3">
      <div class="card-title text-sm"><i class="fa-solid fa-credit-card text-emerald"></i> 4. Eligible Input Tax Credit (ITC Available)</div>
      <div class="calc-breakdown-row mt-3">
        <span>ITC Available - IGST:</span>
        <span class="calc-val text-emerald">₹56,000.00</span>
      </div>
      <div class="calc-breakdown-row">
        <span>ITC Available - CGST:</span>
        <span class="calc-val text-emerald">₹35,000.00</span>
      </div>
      <div class="calc-breakdown-row">
        <span>ITC Available - SGST:</span>
        <span class="calc-val text-emerald">₹35,000.00</span>
      </div>
      <div class="calc-breakdown-row total-row">
        <span>Total Net Cash Tax Payable:</span>
        <span class="calc-val text-accent">₹11,79,000.00</span>
      </div>
    </div>
  `;
}

// =========================================================================
// 10. N8N ORCHESTRATOR & BOT SIMULATOR
// =========================================================================
function initN8nSimulator() {
  const triggerBtn = document.getElementById('btnTriggerN8nTest');
  const terminal = document.getElementById('n8nTerminalBody');

  triggerBtn.addEventListener('click', () => {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing n8n Flow...';
    
    terminal.innerHTML += `\n\n[${new Date().toLocaleTimeString()}] [EXECUTION_STARTED] Webhook payload received from WhatsApp agent...`;

    setTimeout(() => {
      terminal.innerHTML += `\n[${new Date().toLocaleTimeString()}] [NODE_OCR] Image parsed. Extracted GSTIN: 27AABCC1234F1Z5, Amount: ₹59,000.00`;
      terminal.scrollTop = terminal.scrollHeight;
    }, 600);

    setTimeout(() => {
      terminal.innerHTML += `\n[${new Date().toLocaleTimeString()}] [NODE_LLM] Tax engine evaluated: 18% IGST + 2% TDS under 194J.`;
      terminal.scrollTop = terminal.scrollHeight;
    }, 1200);

    setTimeout(() => {
      terminal.innerHTML += `\n[${new Date().toLocaleTimeString()}] [NODE_LEDGER] Schedule III Journal Voucher auto-posted.`;
      terminal.innerHTML += `\n[${new Date().toLocaleTimeString()}] [COMPLETED] Status: 200 OK. WhatsApp response dispatched.`;
      terminal.scrollTop = terminal.scrollHeight;
      
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = '<i class="fa-solid fa-play"></i> Simulate Live n8n Execution Run';
      showToast('n8n Workflow Execution completed successfully!', 'success');
    }, 1800);
  });
}

function initPhoneBot() {
  const phoneBody = document.getElementById('phoneChatBody');
  const phoneInput = document.getElementById('phoneChatInput');
  const phoneSendBtn = document.getElementById('phoneSendBtn');

  function sendPhoneMessage() {
    const text = phoneInput.value.trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append User message
    const userMsg = document.createElement('div');
    userMsg.className = 'phone-msg user';
    userMsg.innerHTML = `<p>${escapeHtml(text)}</p><div class="text-[9px] text-muted text-right mt-1">${timeStr}</div>`;
    phoneBody.appendChild(userMsg);
    phoneInput.value = '';
    phoneBody.scrollTop = phoneBody.scrollHeight;

    // Bot Response
    setTimeout(() => {
      const res = processCopilotQuery(text);
      const botMsg = document.createElement('div');
      botMsg.className = 'phone-msg bot';
      botMsg.innerHTML = `<div>${res.text}</div><div class="text-[9px] text-muted text-right mt-1">${timeStr}</div>`;
      phoneBody.appendChild(botMsg);
      phoneBody.scrollTop = phoneBody.scrollHeight;
    }, 500);
  }

  phoneSendBtn.addEventListener('click', sendPhoneMessage);
  phoneInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendPhoneMessage();
  });
}

// =========================================================================
// 11. EXPORTS (PDF, EXCEL, CSV, GST-JSON)
// =========================================================================
export function exportSampleCsv() {
  const headers = "InvoiceNo,Date,VendorName,VendorGSTIN,Category,TaxableAmount,GSTRate,TotalAmount,TDSSection,TDSAmount\n";
  const rows = State.invoices.map(i => 
    `"${i.invoiceNumber}","${i.invoiceDate}","${i.vendorName}","${i.vendorGSTIN}","${i.category}",${i.taxableAmount},${i.gstRate},${i.totalAmount},"${i.tdsSection}",${i.tdsAmount}`
  ).join("\n");

  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FinCopilot_Transactions_FY24-25.csv`);
  link.click();
  showToast('Transactions CSV file downloaded!', 'success');
}

export function exportGstr1Json() {
  const gstr1Payload = {
    gstin: State.scheduleIII.gstin,
    fp: "112024", // Nov 2024
    cur_gt: 7250000,
    b2b: State.invoices.map(inv => ({
      ctin: inv.customerGSTIN,
      inv: [{
        inum: inv.invoiceNumber,
        idt: inv.invoiceDate,
        val: inv.totalAmount,
        pos: "29",
        rchrg: "N",
        itms: [{
          num: 1,
          itm_det: {
            txval: inv.taxableAmount,
            rt: inv.gstRate,
            iamt: inv.igst,
            camt: inv.cgst,
            samt: inv.sgst
          }
        }]
      }]
    }))
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gstr1Payload, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `GSTR1_Portal_Upload_${State.scheduleIII.gstin}.json`);
  dlAnchor.click();
  showToast('Official GSTR-1 GST Portal JSON file downloaded!', 'success');
}

export function exportScheduleIiiExcel() {
  if (typeof XLSX === 'undefined') {
    exportSampleCsv();
    return;
  }

  const wb = XLSX.utils.book_new();

  // Balance Sheet Worksheet
  const bsRows = [
    ["BHARAT FINTECH INNOVATIONS PRIVATE LIMITED"],
    ["CIN: U72200KA2022PTC156789 | GSTIN: 29AABBD5678M1Z2"],
    ["BALANCE SHEET AS ON 31ST MARCH 2025 (SCHEDULE III FORMAT)"],
    [""],
    ["Particulars", "Note No.", "Amount (INR)"],
    ["I. EQUITY AND LIABILITIES", "", ""],
    ["(1) Shareholders' Funds", "", ""],
    ["  (a) Share Capital", "1", 1000000],
    ["  (b) Reserves and Surplus", "2", 1850000],
    ["(2) Non-Current Liabilities", "", ""],
    ["  (a) Long-Term Borrowings", "3", 1200000],
    ["  (b) Deferred Tax Liabilities", "4", 85000],
    ["(3) Current Liabilities", "", ""],
    ["  (a) Trade Payables", "5", 450000],
    ["  (b) Duties & Taxes Payable", "6", 58000],
    ["  (c) Other Current Liabilities & Provisions", "7", 180000],
    ["TOTAL EQUITY AND LIABILITIES", "", 4823000],
    [""],
    ["II. ASSETS", "", ""],
    ["(1) Non-Current Assets", "", ""],
    ["  (a) Property, Plant and Equipment", "8", 1450000],
    ["  (b) Intangible Assets", "9", 600000],
    ["  (c) Deferred Tax Assets & Security Deposits", "10", 292000],
    ["(2) Current Assets", "", ""],
    ["  (a) Current Inventories", "11", 180000],
    ["  (b) Trade Receivables", "12", 1120000],
    ["  (c) Cash and Bank Balances", "13", 950000],
    ["  (d) Input Tax Credit (ITC) Balance", "14", 126000],
    ["  (e) Short-Term Loans & Advances", "15", 60000],
    ["TOTAL ASSETS", "", 4778000]
  ];

  const ws = XLSX.utils.aoa_to_sheet(bsRows);
  XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet (Sch III)");

  // Transactions Worksheet
  const txnRows = [
    ["Invoice No", "Date", "Vendor Name", "Vendor GSTIN", "Description", "Taxable Amount", "GST Amount", "TDS Amount", "Total Amount"]
  ];
  State.invoices.forEach(i => {
    txnRows.push([
      i.invoiceNumber,
      i.invoiceDate,
      i.vendorName,
      i.vendorGSTIN,
      i.description,
      i.taxableAmount,
      (i.cgst + i.sgst + i.igst),
      i.tdsAmount,
      i.totalAmount
    ]);
  });
  const wsTxn = XLSX.utils.aoa_to_sheet(txnRows);
  XLSX.utils.book_append_sheet(wb, wsTxn, "Ledger Register");

  XLSX.writeFile(wb, "Bharat_FinTech_Schedule_III_FY2024-25.xlsx");
  showToast('Excel (.xlsx) file with Balance Sheet & Ledger downloaded!', 'success');
}

export function exportScheduleIiiPdf() {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    window.print();
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("BHARAT FINTECH INNOVATIONS PRIVATE LIMITED", 14, 18);
  doc.setFontSize(9);
  doc.text("CIN: U72200KA2022PTC156789 | GSTIN: 29AABBD5678M1Z2 | PAN: AABBD5678M", 14, 24);
  doc.text("BALANCE SHEET AS ON 31ST MARCH 2025 (COMPANIES ACT SCHEDULE III)", 14, 30);
  doc.line(14, 33, 196, 33);

  doc.setFontSize(10);
  doc.text("Particulars", 14, 40);
  doc.text("Amount (INR)", 160, 40);

  let y = 48;
  const items = [
    { title: "I. EQUITY AND LIABILITIES", amt: "" },
    { title: "  1. Share Capital (1,00,000 Equity Shares)", amt: "10,00,000.00" },
    { title: "  2. Reserves & Surplus (Retained Earnings)", amt: "18,50,000.00" },
    { title: "  3. Long-Term Borrowings (Term Loans)", amt: "12,00,000.00" },
    { title: "  4. Trade Payables & Sundry Creditors", amt: "4,50,000.00" },
    { title: "  5. Duties & Taxes Payable (GST + TDS)", amt: "58,000.00" },
    { title: "  6. Other Current Liabilities & Provisions", amt: "2,65,000.00" },
    { title: "TOTAL LIABILITIES", amt: "48,23,000.00", bold: true },
    { title: "", amt: "" },
    { title: "II. ASSETS", amt: "" },
    { title: "  1. Property, Plant & Equipment (Computers & Hardware)", amt: "14,50,000.00" },
    { title: "  2. Intangible Assets (AI Software Platform)", amt: "6,00,000.00" },
    { title: "  3. Deferred Tax Assets & Security Deposits", amt: "2,92,000.00" },
    { title: "  4. Current Inventories", amt: "1,80,000.00" },
    { title: "  5. Trade Receivables (Sundry Debtors)", amt: "11,20,000.00" },
    { title: "  6. Cash and Bank Balances (HDFC Current A/c)", amt: "9,50,000.00" },
    { title: "  7. Input Tax Credit (ITC) Electronic Ledger", amt: "1,26,000.00" },
    { title: "  8. Short-Term Loans & Advances", amt: "60,000.00" },
    { title: "TOTAL ASSETS", amt: "47,78,000.00", bold: true }
  ];

  items.forEach(it => {
    if (it.bold) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");
    doc.text(it.title, 14, y);
    if (it.amt) doc.text(`INR ${it.amt}`, 160, y);
    y += 7;
  });

  doc.line(14, y + 2, 196, y + 2);
  doc.setFontSize(8);
  doc.text("Generated by FinCopilot India AI Accounting Helpline (FY 2024-25 ICAI / Schedule III Compliant)", 14, y + 10);

  doc.save("Bharat_FinTech_BalanceSheet_FY24-25.pdf");
  showToast('Official Balance Sheet PDF generated and downloaded!', 'success');
}

// =========================================================================
// 12. MODAL CONTROLS
// =========================================================================
function initModals() {
  const modal = document.getElementById('addTxnModal');
  const openBtn = document.getElementById('btnAddNewTxnModal');
  const closeBtn = document.getElementById('closeAddTxnModal');
  const cancelBtn = document.getElementById('cancelAddTxnModal');
  const form = document.getElementById('newTxnForm');

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  [closeBtn, cancelBtn].forEach(b => b.addEventListener('click', () => modal.classList.remove('active')));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const vendor = document.getElementById('newTxnVendor').value;
    const gstin = document.getElementById('newTxnGSTIN').value.toUpperCase();
    const date = document.getElementById('newTxnDate').value;
    const cat = document.getElementById('newTxnCategory').value;
    const taxable = parseFloat(document.getElementById('newTxnTaxable').value) || 0;
    const gstRate = parseFloat(document.getElementById('newTxnGSTRate').value) || 0;
    const tdsSec = document.getElementById('newTxnTdsSection').value;
    const supply = document.getElementById('newTxnSupplyType').value;

    let tdsRate = 0;
    if (tdsSec.includes('194J-Tech')) tdsRate = 2;
    else if (tdsSec.includes('194J-Prof') || tdsSec.includes('194I-Rent')) tdsRate = 10;
    else if (tdsSec.includes('194C-Ind')) tdsRate = 1;
    else if (tdsSec.includes('194C-Corp')) tdsRate = 2;

    const isInter = supply === 'inter';
    const totalGst = (taxable * gstRate) / 100;
    const cgst = !isInter ? totalGst / 2 : 0;
    const sgst = !isInter ? totalGst / 2 : 0;
    const igst = isInter ? totalGst : 0;
    const tdsAmount = (taxable * tdsRate) / 100;
    const totalInvoice = taxable + totalGst;
    const netPayable = totalInvoice - tdsAmount;

    const newInv = {
      id: `VCH-${Date.now().toString().slice(-4)}`,
      vendorName: vendor,
      vendorGSTIN: gstin,
      customerGSTIN: '29AABBD5678M1Z2',
      invoiceNumber: `INV/${Date.now().toString().slice(-4)}`,
      invoiceDate: date,
      hsnSac: '998311',
      description: `${cat} - Voucher Entry`,
      taxableAmount: taxable,
      gstRate,
      gstType: isInter ? 'IGST' : 'CGST+SGST',
      igst,
      cgst,
      sgst,
      totalAmount: totalInvoice,
      tdsSection: tdsSec !== 'None' ? tdsSec.split('-')[0] : 'None',
      tdsRate,
      tdsAmount,
      netPayable,
      category: cat,
      status: 'Verified',
      journalEntry: {
        debit: [
          { account: `${cat} Expense A/c`, amount: taxable },
          { account: isInter ? 'Input Tax Credit - IGST A/c' : 'Input Tax Credit - CGST A/c', amount: isInter ? igst : cgst },
          ...(!isInter ? [{ account: 'Input Tax Credit - SGST A/c', amount: sgst }] : [])
        ],
        credit: [
          ...(tdsAmount > 0 ? [{ account: `TDS Payable u/s ${tdsSec.split('-')[0]} A/c`, amount: tdsAmount }] : []),
          { account: `${vendor} A/c`, amount: netPayable }
        ]
      }
    };

    State.invoices.unshift(newInv);
    renderScheduleIII();
    renderGstr1();
    modal.classList.remove('active');
    form.reset();
    showToast(`Voucher for ${vendor} successfully posted!`, 'success');
  });
}
