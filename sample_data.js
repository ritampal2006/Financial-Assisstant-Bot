// FinCopilot India - Sample Datasets & Indian Accounting Standards Master Data

export const INDIAN_STATE_GST_CODES = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh"
};

export const HSN_SAC_DIRECTORY = [
  { code: "998311", type: "SAC", desc: "Management consulting and management services", gstRate: 18 },
  { code: "998313", type: "SAC", desc: "IT design and development services for software", gstRate: 18 },
  { code: "998315", type: "SAC", desc: "Hosting and data infrastructure provisioning services", gstRate: 18 },
  { code: "998221", type: "SAC", desc: "Accounting, auditing and bookkeeping services", gstRate: 18 },
  { code: "998211", type: "SAC", desc: "Legal advisory and representation services (RCM Applicable)", gstRate: 18 },
  { code: "997212", type: "SAC", desc: "Renting of commercial immovable property", gstRate: 18 },
  { code: "996511", type: "SAC", desc: "Road transport services of goods by GTA (5% or 12%)", gstRate: 5 },
  { code: "847130", type: "HSN", desc: "Laptops, Notebooks & Portable automatic data processing units", gstRate: 18 },
  { code: "851713", type: "HSN", desc: "Smartphones and cellular network devices", gstRate: 18 },
  { code: "940310", type: "HSN", desc: "Office furniture and ergonomic workstations", gstRate: 18 },
  { code: "482010", type: "HSN", desc: "Registers, account books, note books, order books, receipt books", gstRate: 18 },
  { code: "210690", type: "HSN", desc: "Food preparations, pantry supplies (Dry fruits, teas)", gstRate: 5 },
  { code: "870321", type: "HSN", desc: "Motor vehicles for transport of persons (Non-ITC)", gstRate: 28 }
];

export const TDS_SECTIONS_MASTER = {
  "194C": {
    name: "Payments to Contractors & Sub-contractors",
    rates: { "Individual/HUF": 1.0, "Company/Firm/Others": 2.0 },
    threshold: "₹30,000 single contract or ₹1,00,000 aggregate in FY",
    note: "Deduct 1% for Individual/HUF contractors, 2% for Corporate entities. No TDS if PAN not provided (20% under 206AA)."
  },
  "194J": {
    name: "Fees for Professional / Technical Services & Royalty",
    rates: { "Technical Services / BPO / Call Center": 2.0, "Professional Services / Royalty / Non-Compete": 10.0 },
    threshold: "₹30,000 per financial year",
    note: "2% applies to Technical Services (FTS) & Call Centers. 10% applies to Lawyers, CAs, Doctors, Architects & Royalties."
  },
  "194I": {
    name: "Rent of Immovable Property / Plant & Machinery",
    rates: { "Plant, Machinery or Equipment": 2.0, "Land, Building, Furniture & Fittings": 10.0 },
    threshold: "₹2,40,000 per financial year",
    note: "Rent for office premises exceeding ₹20k/month requires 10% TDS deduction."
  },
  "194Q": {
    name: "Deduction of Tax on Purchase of Goods",
    rates: { "All Entities": 0.1 },
    threshold: "Aggregate purchase exceeds ₹50 Lakhs in FY (Turnover > ₹10 Cr)",
    note: "0.1% TDS on value exceeding ₹50 Lakhs. If PAN not furnished, rate is 5%."
  },
  "194H": {
    name: "Commission or Brokerage",
    rates: { "All Payees": 5.0 },
    threshold: "₹15,000 per financial year",
    note: "Applicable on sales commission, affiliate earnings and brokerage payouts."
  },
  "194A": {
    name: "Interest other than Interest on Securities (Banks / Loans)",
    rates: { "All Payees": 10.0 },
    threshold: "₹40,000 (₹50,000 for Senior Citizens) for Banks; ₹5,000 for Others",
    note: "Deducted by NBFCs, Banks or firms paying interest on unsecured loans."
  }
};

export const SAMPLE_INVOICES = [
  {
    id: "INV-2024-001",
    vendorName: "CloudTech Solutions Private Limited",
    vendorGSTIN: "27AABCC1234F1Z5", // Maharashtra
    customerGSTIN: "29AABBD5678M1Z2", // Karnataka (Inter-state => IGST)
    invoiceNumber: "CTS/24-25/0892",
    invoiceDate: "2024-11-14",
    hsnSac: "998315",
    description: "Enterprise Cloud Hosting & Server Provisioning Services (Nov 2024)",
    taxableAmount: 50000,
    gstRate: 18,
    gstType: "IGST",
    igst: 9000,
    cgst: 0,
    sgst: 0,
    totalAmount: 59000,
    tdsSection: "194J",
    tdsRate: 2,
    tdsAmount: 1000,
    netPayable: 58000,
    category: "Cloud Infrastructure",
    status: "Verified",
    journalEntry: {
      debit: [
        { account: "Hosting & Server Expense A/c", amount: 50000 },
        { account: "Input Tax Credit - IGST A/c", amount: 9000 }
      ],
      credit: [
        { account: "TDS Payable u/s 194J A/c", amount: 1000 },
        { account: "CloudTech Solutions Pvt Ltd A/c", amount: 58000 }
      ]
    }
  },
  {
    id: "INV-2024-002",
    vendorName: "Apex Infosystems & Consulting LLP",
    vendorGSTIN: "29AAKFA4433E1ZQ", // Karnataka
    customerGSTIN: "29AABBD5678M1Z2", // Karnataka (Intra-state => CGST + SGST)
    invoiceNumber: "APX/BLR/401",
    invoiceDate: "2024-11-18",
    hsnSac: "998311",
    description: "IT Software Architecture & AI Implementation Retainer",
    taxableAmount: 100000,
    gstRate: 18,
    gstType: "CGST+SGST",
    igst: 0,
    cgst: 9000,
    sgst: 9000,
    totalAmount: 118000,
    tdsSection: "194J",
    tdsRate: 10,
    tdsAmount: 10000,
    netPayable: 108000,
    category: "Professional & Legal Fees",
    status: "Verified",
    journalEntry: {
      debit: [
        { account: "Software Consulting Expense A/c", amount: 100000 },
        { account: "Input Tax Credit - CGST A/c", amount: 9000 },
        { account: "Input Tax Credit - SGST A/c", amount: 9000 }
      ],
      credit: [
        { account: "TDS Payable u/s 194J A/c", amount: 10000 },
        { account: "Apex Infosystems LLP A/c", amount: 108000 }
      ]
    }
  },
  {
    id: "INV-2024-003",
    vendorName: "Nexus Workspace Real Estate Hub",
    vendorGSTIN: "29AAGCN9988D1Z4", // Karnataka
    customerGSTIN: "29AABBD5678M1Z2", // Karnataka (Intra-state)
    invoiceNumber: "NEXUS/RENT/1124",
    invoiceDate: "2024-11-01",
    hsnSac: "997212",
    description: "Commercial Office Rent - 4th Floor Tech Park (Month of Nov 2024)",
    taxableAmount: 65000,
    gstRate: 18,
    gstType: "CGST+SGST",
    igst: 0,
    cgst: 5850,
    sgst: 5850,
    totalAmount: 76700,
    tdsSection: "194I",
    tdsRate: 10,
    tdsAmount: 6500,
    netPayable: 70200,
    category: "Rent & Facilities",
    status: "Verified",
    journalEntry: {
      debit: [
        { account: "Office Rent Expense A/c", amount: 65000 },
        { account: "Input Tax Credit - CGST A/c", amount: 5850 },
        { account: "Input Tax Credit - SGST A/c", amount: 5850 }
      ],
      credit: [
        { account: "TDS Payable u/s 194I A/c", amount: 6500 },
        { account: "Nexus Workspace Hub A/c", amount: 70200 }
      ]
    }
  },
  {
    id: "INV-2024-004",
    vendorName: "Dell India Computer Solutions Pvt Ltd",
    vendorGSTIN: "29AABCD1122C1ZR",
    customerGSTIN: "29AABBD5678M1Z2",
    invoiceNumber: "DELL-IN-90921",
    invoiceDate: "2024-10-25",
    hsnSac: "847130",
    description: "Dell Precision 5570 Developer Laptops (Qty: 2)",
    taxableAmount: 240000,
    gstRate: 18,
    gstType: "CGST+SGST",
    igst: 0,
    cgst: 21600,
    sgst: 21600,
    totalAmount: 283200,
    tdsSection: "None",
    tdsRate: 0,
    tdsAmount: 0,
    netPayable: 283200,
    category: "Fixed Assets (Computer & Peripherals)",
    status: "Verified",
    journalEntry: {
      debit: [
        { account: "Computer Hardware & Laptops A/c", amount: 240000 },
        { account: "Input Tax Credit - CGST A/c", amount: 21600 },
        { account: "Input Tax Credit - SGST A/c", amount: 21600 }
      ],
      credit: [
        { account: "Dell India Pvt Ltd A/c", amount: 283200 }
      ]
    }
  },
  {
    id: "INV-2024-005",
    vendorName: "QuickLogistics Express Courier Services",
    vendorGSTIN: "27AABQ8899K1Z3",
    customerGSTIN: "29AABBD5678M1Z2",
    invoiceNumber: "QL-EXP-7711",
    invoiceDate: "2024-11-20",
    hsnSac: "996511",
    description: "Goods Transport Agency (GTA) Freight Dispatch",
    taxableAmount: 15000,
    gstRate: 5,
    gstType: "IGST (RCM)",
    igst: 750,
    cgst: 0,
    sgst: 0,
    totalAmount: 15000,
    tdsSection: "194C",
    tdsRate: 2,
    tdsAmount: 300,
    netPayable: 14700,
    category: "Freight & Logistics",
    status: "RCM Applicable",
    journalEntry: {
      debit: [
        { account: "Freight & Shipping Expense A/c", amount: 15000 },
        { account: "Input Tax Credit - IGST RCM A/c", amount: 750 }
      ],
      credit: [
        { account: "TDS Payable u/s 194C A/c", amount: 300 },
        { account: "GST RCM Output Liability A/c", amount: 750 },
        { account: "QuickLogistics Express A/c", amount: 14700 }
      ]
    }
  }
];

export const DEFAULT_SCHEDULE_III_DATA = {
  companyName: "Bharat FinTech Innovations Private Limited",
  cin: "U72200KA2022PTC156789",
  pan: "AABBD5678M",
  gstin: "29AABBD5678M1Z2",
  financialYear: "FY 2024-25 (Period: 01-Apr-2024 to 31-Mar-2025)",
  asOnDate: "31st March 2025",
  equityAndLiabilities: {
    shareholdersFunds: {
      shareCapital: 1000000, // 10 Lakhs
      reservesAndSurplus: 1850000 // 18.5 Lakhs
    },
    nonCurrentLiabilities: {
      longTermBorrowings: 1200000, // 12 Lakhs Term Loan
      deferredTaxLiabilities: 85000
    },
    currentLiabilities: {
      tradePayables: 450000,
      otherCurrentLiabilities: 120000,
      dutiesAndTaxesPayable: {
        gstPayableNet: 45000,
        tdsPayable: 28000,
        advanceTaxAdjustment: -15000
      },
      shortTermProvisions: 60000
    }
  },
  assets: {
    nonCurrentAssets: {
      propertyPlantEquipment: 1450000,
      intangibleAssets: 600000,
      deferredTaxAssets: 42000,
      longTermLoansAndAdvances: 250000
    },
    currentAssets: {
      inventories: 180000,
      tradeReceivables: 1120000,
      cashAndBankBalances: 995000,
      inputTaxCreditBalance: {
        itcCGST: 35000,
        itcSGST: 35000,
        itcIGST: 56000
      },
      shortTermLoansAndAdvances: 60000
    }
  },
  profitLoss: {
    revenueFromOperations: 7250000,
    otherIncome: 140000,
    expenses: {
      costOfServicesMaterials: 1850000,
      employeeBenefitExpenses: 2200000,
      financeCosts: 110000,
      depreciationAndAmortization: 240000,
      cloudAndITExpenses: 340000,
      rentAndOfficeMaintenance: 310000,
      otherOperatingExpenses: 280000
    },
    taxExpense: {
      currentTax: 510000,
      deferredTax: -15000
    }
  }
};

export const FREQUENT_TAX_QUESTIONS = [
  {
    label: "Calculate GST on ₹10,000 IT consulting invoice",
    query: "Calculate GST on ₹10,000 IT consulting invoice"
  },
  {
    label: "What is TDS 194J rate for technical vs legal?",
    query: "What is the TDS rate under Section 194J for technical services vs legal and professional fees?"
  },
  {
    label: "Compare New vs Old Tax Regime for ₹15 Lakh income",
    query: "Compare New Tax Regime (Budget FY 24-25) vs Old Tax Regime for an annual salary of ₹15,00,000"
  },
  {
    label: "Check Advance Tax installment deadlines & interest",
    query: "What are the Indian Advance Tax payment dates and interest penalty under Section 234B and 234C?"
  },
  {
    label: "How to post journal voucher for Dell laptop purchase?",
    query: "Show me the double entry journal voucher for purchasing a laptop worth ₹2,40,000 with 18% GST"
  },
  {
    label: "Explain GSTR-2B ITC reconciliation rules",
    query: "How does GSTR-2B vs GSTR-3B Input Tax Credit matching work under Rule 36(4)?"
  }
];
