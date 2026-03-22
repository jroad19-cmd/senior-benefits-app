
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

const STATES = {
  "PA": {
    "portal": "https://www.compass.state.pa.us/compass.web/Public/CMPHome",
    "unclaimed": "https://www.patreasury.gov/unclaimed-property/"
  },
  "OH": {
    "portal": "https://benefits.ohio.gov/",
    "unclaimed": "https://com.ohio.gov/divisions-and-programs/unclaimed-funds"
  },
  "NY": {
    "portal": "https://mybenefits.ny.gov/mybenefits/begin",
    "unclaimed": "https://ouf.osc.state.ny.us/ouf/"
  },
  "NJ": {
    "portal": "https://www.njhelps.gov/",
    "unclaimed": "https://unclaimedfunds.nj.gov/"
  },
  "CA": {
    "portal": "https://benefitscal.com/",
    "unclaimed": "https://ucpi.sco.ca.gov/en/Property/SearchIndex"
  },
  "TX": {
    "portal": "https://www.yourtexasbenefits.com/",
    "unclaimed": "https://www.claimittexas.gov/"
  },
  "FL": {
    "portal": "https://www.myflfamilies.com/services/public-assistance",
    "unclaimed": "https://www.fltreasurehunt.gov/"
  }
};
const ALL_STATES = [
 "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
 "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
 "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];
const CONDITIONS = [
  "None selected","Cancer","Diabetes","Heart disease","COPD / lung disease","Kidney disease",
  "Multiple sclerosis","Parkinson's disease","Rheumatoid arthritis","Rare disease",
  "Traumatic brain injury","Other chronic disease"
];

const MONTH_OPTIONS = [
  { value: "", label: "Month" },
  { value: "01", label: "Jan" }, { value: "02", label: "Feb" }, { value: "03", label: "Mar" },
  { value: "04", label: "Apr" }, { value: "05", label: "May" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Aug" }, { value: "09", label: "Sep" },
  { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" }
];
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const YEAR_OPTIONS = Array.from({ length: 110 }, (_, i) => String(new Date().getFullYear() - i));

function splitDobParts(dob) {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return { year: "", month: "", day: "" };
  const [year, month, day] = dob.split("-");
  return { year, month, day };
}

function buildDob(year, month, day) {
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

const WHY = {
  citizenStatus: "Why this matters: Many programs require U.S. citizenship or qualified status.",
  needsHelpDailyLiving: "Why this matters: Helps find programs that pay for in-home care or assistance.",
  needsSupervision: "Why this matters: Some programs require supervision needs to qualify for care services.",
  cannotLiveAlone: "Why this matters: This helps determine eligibility for housing or care programs like Domiciliary Care.",
  nursingFacilityLevelCare: "Why this matters: Required for certain programs that provide long-term care at home instead of a nursing home.",
  medicareA: "Why this matters: Determines if you may qualify for programs that lower Medicare costs.",
  medicareB: "Why this matters: Determines if you may qualify for programs that lower Medicare costs.",
  medicareD: "Why this matters: Helps find prescription savings programs.",
  medicaid: "Why this matters: Some programs only apply if you already have Medicaid.",
  prescriptionCosts: "Why this matters: Helps find programs that reduce medication expenses.",
  retired: "Why this matters: Required for reduced vehicle registration fees in Pennsylvania.",
  ownsVehicle: "Why this matters: Needed to check eligibility for vehicle-related savings.",
  checkingBalance: "Why this matters: Some programs have resource or asset limits.",
  savingsBalance: "Why this matters: Some programs have resource or asset limits.",
  medicalCondition: "Why this matters: Some charities and grant programs open funds by diagnosis or disease category."
};

const emptyForm = {
  personName: "", dob: "", age: "", maritalStatus: "single", disability: "no", veteran: "no",
  citizenStatus: "citizen", medicalCondition: "None selected", state: "PA", county: "", schoolDistrict: "",
  householdSize: "1", livesAlone: "yes", needsSupervision: "no", cannotLiveAlone: "no",
  needsHelpDailyLiving: "no", nursingFacilityLevelCare: "no", housing: "rent", primaryResidence: "yes",
  monthlyRentMortgage: "", propertyTaxesPaid: "", utilitiesSeparate: "yes", monthlySocialSecurity: "",
  monthlySSI: "", monthlySSDI: "", monthlyPension: "", monthlyWages: "", monthlyInterest: "",
  monthlyOtherIncome: "", checkingBalance: "", savingsBalance: "", otherAssets: "", medicareA: "no",
  medicareB: "no", medicareD: "no", medicaid: "no", prescriptionCosts: "", longTermCare: "no",
  retired: "no", ownsVehicle: "no"
};

function currency(n) {
  return Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function ageFromDob(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return String(age);
}
function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
function totalIncome(f) {
  return ["monthlySocialSecurity","monthlySSI","monthlySSDI","monthlyPension","monthlyWages","monthlyInterest","monthlyOtherIncome"]
    .reduce((sum, key) => sum + Number(f[key] || 0), 0);
}
function totalAssets(f) {
  return Number(f.checkingBalance || 0) + Number(f.savingsBalance || 0) + Number(f.otherAssets || 0);
}
function completeness(f) {
  const keys = ["age","state","householdSize","housing","primaryResidence","monthlySocialSecurity","monthlySSI","monthlySSDI",
    "checkingBalance","savingsBalance","disability","citizenStatus","medicareA","medicareB","medicareD",
    "needsHelpDailyLiving","needsSupervision","cannotLiveAlone","nursingFacilityLevelCare","medicalCondition"];
  let count = 0;
  keys.forEach(k => { if (String(f[k] ?? "").trim() !== "") count += 1; });
  return count / keys.length;
}
function scoreLabel(score, fill) {
  if (fill >= 0.9 && score >= 95) return "Definitely worth applying";
  if (score >= 80) return "Strong match";
  if (score >= 55) return "Possible";
  return "Needs more information";
}
function add(items, name, type, category, sourceType, description, docs, link, score, reason, missing, nextStep) {
  items.push({ name, type, category, sourceType, description, docs, link, score, reason, missing, nextStep });
}
function conditionContext(condition) {
  const map = {
    "Cancer": { label: "cancer-related grant and copay help", details: "Funds may cover treatment-related costs, premiums, copays, transportation, or medication support." },
    "Diabetes": { label: "diabetes-related medication and supply help", details: "Funds may help with insulin, diabetes medications, supplies, and premium or copay support." },
    "Heart disease": { label: "heart-disease financial help", details: "Funds may help with heart medications, specialty treatment costs, and premium or copay support." },
    "COPD / lung disease": { label: "lung-disease financial help", details: "Funds may help with respiratory medications, oxygen-related care costs, and treatment copays." },
    "Kidney disease": { label: "kidney-disease financial help", details: "Funds may help with dialysis-related medications, treatment copays, and specialty-care costs." },
    "Multiple sclerosis": { label: "multiple-sclerosis financial help", details: "Funds may help with specialty medications, treatment copays, and disease-management costs." },
    "Parkinson's disease": { label: "Parkinson's disease financial help", details: "Funds may help with medications, specialist visits, and related treatment expenses." },
    "Rheumatoid arthritis": { label: "rheumatoid-arthritis financial help", details: "Funds may help with biologics, specialty medications, and treatment copays." },
    "Rare disease": { label: "rare-disease assistance", details: "Rare-disease organizations may offer disease-specific grants, medication help, or travel support." },
    "Traumatic brain injury": { label: "traumatic-brain-injury support", details: "Programs may help with rehabilitation, home supports, and disease-specific financial resources." },
    "Other chronic disease": { label: "chronic-disease financial help", details: "Condition-based grant programs may still be available depending on diagnosis and treatment." },
    "None selected": { label: "disease-specific help", details: "Choose a condition to narrow results." }
  };
  return map[condition] || map["Other chronic disease"];
}
function missingInfoPrompts(f) {
  const prompts = [];
  const age = Number(f.age || 0);
  const medicareRelevant = age >= 65 || f.disability === "yes" || f.medicareA === "yes" || f.medicareB === "yes";
  const careRelevant = f.disability === "yes" || age >= 60 || f.longTermCare === "yes";
  const paRelevant = f.state === "PA";
  const addPrompt = (field, text) => { if (String(f[field] ?? "").trim() === "") prompts.push(text); };
  addPrompt("age", "Add age or date of birth to improve nearly every result.");
  addPrompt("householdSize", "Add household size to tighten SNAP screening.");
  addPrompt("monthlySocialSecurity", "Enter Social Security income, even if it is $0.");
  addPrompt("monthlySSI", "Enter SSI income, even if it is $0.");
  addPrompt("monthlySSDI", "Enter SSDI income, even if it is $0.");
  addPrompt("checkingBalance", "Enter checking balance to improve SSI, Medicaid, and Medicare Savings screening.");
  addPrompt("savingsBalance", "Enter savings balance to improve SSI, Medicaid, and Extra Help screening.");
  if (String(f.citizenStatus ?? "").trim() === "" || f.citizenStatus === "other") prompts.push("Confirm citizenship or qualified status to improve SNAP, SSI, and Medicaid screening.");
  if (f.medicalCondition === "None selected") prompts.push("Choose a medical condition if you want disease-specific grants and copay help options.");
  if (medicareRelevant) addPrompt("prescriptionCosts", "Enter prescription costs to improve Extra Help and prescription savings results.");
  if (careRelevant) {
    if (String(f.needsHelpDailyLiving ?? "").trim() === "" || f.needsHelpDailyLiving === "no") prompts.push("If help with daily living is needed, answer that to improve home-care and CHC results.");
    if (String(f.needsSupervision ?? "").trim() === "" || f.needsSupervision === "no") prompts.push("If supervision is needed, answer that to improve Domiciliary Care results.");
    if (String(f.cannotLiveAlone ?? "").trim() === "" || f.cannotLiveAlone === "no") prompts.push("If the person cannot live alone, answer that to improve supportive-living results.");
  }
  if (paRelevant && f.housing === "own") {
    addPrompt("propertyTaxesPaid", "Enter yearly property taxes paid to improve PA tax-relief results.");
    addPrompt("schoolDistrict", "Enter school district to improve PA Homestead / Farmstead Exclusion guidance.");
  }
  return prompts.slice(0, 8);
}
function autoFlags(f, results) {
  const flags = [];
  const income = totalIncome(f);
  const assets = totalAssets(f);
  const age = Number(f.age || 0);
  if (f.state === "PA" && age >= 65 && f.housing === "own" && f.primaryResidence === "yes" && Number(f.propertyTaxesPaid || 0) > 0) {
    flags.push("PA homeowner: check both PA Property Tax / Rent Rebate and PA Homestead / Farmstead Exclusion.");
  }
  if ((age >= 65 || f.disability === "yes") && income <= 1971 && ((f.maritalStatus === "married" && assets <= 3000) || (f.maritalStatus !== "married" && assets <= 2000))) {
    flags.push("SSI looks especially strong based on income, age/disability, and assets entered.");
  }
  if (f.medicalCondition !== "None selected") {
    const ctx = conditionContext(f.medicalCondition);
    flags.push(`Search ${ctx.label} because ${f.medicalCondition} was selected.`);
  }
  if (results.filter(r => r.sourceType === "official").length === 0) {
    flags.push("Use the official-links filter to focus only on government or official program sites.");
  }
  return flags;
}
function buildResults(f) {
  const age = Number(f.age || 0);
  const income = totalIncome(f);
  const assets = totalAssets(f);
  const household = Math.max(1, Number(f.householdSize || 1));
  const fill = completeness(f);
  const items = [];
  const ctx = conditionContext(f.medicalCondition);

  let ssiScore = 0;
  if (age >= 65 || f.disability === "yes") ssiScore += 35;
  if (income <= 1971) ssiScore += 40;
  if ((f.maritalStatus === "married" && assets <= 3000) || (f.maritalStatus !== "married" && assets <= 2000)) ssiScore += 20;
  if (f.citizenStatus !== "other") ssiScore += 5;
  add(items, "SSI", "Federal", "Cash / income", "official",
    "Monthly cash assistance for older adults and people with disabilities who meet income and resource rules.",
    "Photo ID, Social Security number, citizenship or qualified status, income proof, bank balances, housing costs.",
    "https://www.ssa.gov/ssi", ssiScore,
    "Matched because age/disability, income, assets, and citizenship status are used in SSI screening.",
    ["Exact monthly income by source", "Checking and savings balances", "Citizenship or qualified status", "Living arrangement and housing cost proof"],
    "Open the official SSI page, gather your documents, then start the SSA application or screening process."
  );

  let snapScore = 0;
  const snapLimit = 2550 + (household - 1) * 900;
  if (income <= snapLimit) snapScore += 70;
  if (f.housing === "rent" || Number(f.monthlyRentMortgage || 0) > 0) snapScore += 15;
  if (f.utilitiesSeparate === "yes") snapScore += 10;
  if (f.citizenStatus !== "other") snapScore += 5;
  add(items, "SNAP", "Federal", "Food", "official",
    "Monthly grocery help based on income and household size.",
    "ID, citizenship or qualified status, income proof, rent or mortgage, utility bills, household members.",
    "https://www.fns.usda.gov/snap", snapScore,
    "Matched because SNAP uses household size, income, housing cost, and utility details.",
    ["Household size", "Rent or mortgage amount", "Utility costs", "Citizenship or qualified status"],
    "Open the official SNAP information page or your state portal and apply with your household and income details."
  );

  let medicaidScore = 0;
  if (f.disability === "yes" || age >= 65) medicaidScore += 35;
  if (income <= 2200) medicaidScore += 30;
  if (assets <= 10000) medicaidScore += 20;
  if (f.citizenStatus !== "other") medicaidScore += 5;
  if (f.longTermCare === "yes" || f.needsHelpDailyLiving === "yes") medicaidScore += 10;
  add(items, "Medicaid (Disability Path)", "Federal / State", "Medical / disability support", "official",
    "Medical coverage pathway commonly used by younger people with disabilities and adults with care needs.",
    "ID, citizenship or qualified status, medical records, income proof, bank balances, disability information.",
    STATES[f.state]?.portal || "https://www.medicaid.gov/", medicaidScore,
    "Matched because disability, age, income, assets, and care needs all strengthen Medicaid screening.",
    ["Medical records or disability proof", "Bank balances", "Monthly income by source", "Care-need details"],
    "Use the official state portal to begin Medicaid screening and gather medical and financial records first."
  );

  if (age >= 65 || f.disability === "yes" || f.medicareA === "yes" || f.medicareB === "yes") {
    let msp = 0;
    if (f.medicareA === "yes" || f.medicareB === "yes") msp += 30;
    if (income <= 2200) msp += 40;
    if (assets <= 10000) msp += 20;
    if (f.citizenStatus !== "other") msp += 10;
    add(items, "Medicare Savings Programs", "Federal / State", "Medical / prescription savings", "official",
      "Help paying Medicare premiums and sometimes deductibles or copays.",
      "Medicare card, ID, citizenship or qualified status, income proof, bank balances.",
      "https://www.medicare.gov/basics/costs/help/medicare-savings-programs", msp,
      "Matched because Medicare status, income, assets, and citizenship help determine likely MSP eligibility.",
      ["Medicare Part A/B status", "Income proof", "Checking and savings balances", "Citizenship or qualified status"],
      "Open the official Medicare Savings page, then apply through the state Medicaid office or portal."
    );

    let extraHelp = 0;
    if (f.medicareD === "yes" || f.medicareA === "yes" || f.medicareB === "yes") extraHelp += 25;
    if (income <= 2500) extraHelp += 40;
    if (assets <= 18000) extraHelp += 20;
    if (Number(f.prescriptionCosts || 0) > 0) extraHelp += 15;
    add(items, "Extra Help for Prescriptions", "Federal", "Medical / prescription savings", "official",
      "Help paying Medicare Part D prescription costs.",
      "Medicare information, citizenship or qualified status, prescription list, income and resource details.",
      "https://www.ssa.gov/extrahelp", extraHelp,
      "Matched because Medicare drug coverage, prescription costs, income, and assets matter for Extra Help.",
      ["Prescription cost total", "Medicare Part D status", "Income details", "Resource totals"],
      "Open the official Extra Help page and gather your Medicare and prescription information before applying."
    );
  }

  const statePortal = STATES[f.state]?.portal || "https://www.benefits.gov/benefit-finder";
  const stateUnclaimed = STATES[f.state]?.unclaimed || "https://www.missingmoney.com/";
  add(items, `${f.state} State Benefits Portal`, "State", "General state help", "official",
    "Official state portal for food, medical, cash, utility, and other support programs.",
    "ID, address, income proof, household size.", statePortal, 100,
    "This is an official entry point for your state’s benefit programs.",
    ["Basic identity and address info", "Income details", "Household size"],
    "Open the official portal and review the benefit categories that match your situation."
  );
  add(items, `${f.state} Unclaimed Money`, "State", "Unclaimed money", "official",
    "Search for unclaimed money, dormant accounts, old refunds, or property owed to you.",
    "Your name and current or past address.", stateUnclaimed, 100,
    "This is worth checking because unclaimed property searches do not depend on income eligibility.",
    ["Full legal name", "Current and past addresses"],
    "Open the official unclaimed property search and try your name plus previous addresses."
  );

  if (f.medicalCondition !== "None selected") {
    add(items, `${f.medicalCondition} grant search - PAN Foundation`, "National charity", "Disease-specific grants", "charity",
      `Search ${ctx.label} through PAN Foundation. ${ctx.details}`,
      "Diagnosis name, medication list, insurance information, household income.",
      "https://www.panfoundation.org/find-disease-fund/", 92,
      `Matched because ${f.medicalCondition} was selected and PAN often organizes help by disease fund.`,
      ["Diagnosis confirmation", "Medication list", "Insurance information", "Household income"],
      "Open PAN Foundation, search the disease fund, and check whether the fund is open today."
    );
    add(items, `${f.medicalCondition} fund alerts - PAN FundFinder`, "National charity", "Disease-specific grants", "charity",
      `Track disease-fund openings related to ${f.medicalCondition}. ${ctx.details}`,
      "Email address and diagnosis or disease category.",
      "https://www.panfoundation.org/fundfinder/", 90,
      "Matched because this tool can alert you when disease funds open for the selected condition.",
      ["Diagnosis name", "Email address"],
      "Open FundFinder and sign up for alerts for the selected diagnosis."
    );
    add(items, `${f.medicalCondition} support - HealthWell`, "National charity", "Disease-specific grants", "charity",
      `Check open HealthWell funds connected to ${f.medicalCondition}. ${ctx.details}`,
      "Diagnosis, treatment or medication, insurance information, income.",
      "https://www.healthwellfoundation.org/disease-funds/", 90,
      "Matched because HealthWell disease funds are often tied to diagnosis and treatment type.",
      ["Diagnosis details", "Treatment or medication name", "Insurance information", "Income"],
      "Open HealthWell’s disease fund page and search for the selected condition."
    );
    if (f.medicalCondition === "Rare disease") {
      add(items, "Rare disease assistance - NORD", "National charity", "Rare disease help", "charity",
        "Rare-disease medication, premium, co-pay, travel, and related patient assistance resources.",
        "Diagnosis details, provider information, treatment plan, financial information.",
        "https://rarediseases.org/patient-assistance/", 94,
        "Matched because NORD is especially relevant when a rare disease is selected.",
        ["Rare disease diagnosis", "Provider information", "Treatment plan", "Financial details"],
        "Open NORD patient assistance and review rare-disease support options."
      );
    }
    add(items, `${f.medicalCondition} copay relief - Patient Advocate Foundation`, "National charity", "Disease-specific grants", "charity",
      `Check co-pay relief and financial aid options related to ${f.medicalCondition}. ${ctx.details}`,
      "Diagnosis, treatment details, insurance details, household income.",
      "https://www.patientadvocate.org/connect-with-services/copay-relief/", 88,
      "Matched because copay relief often depends on diagnosis, treatment, and insurance type.",
      ["Diagnosis", "Treatment details", "Insurance card", "Income"],
      "Open the co-pay relief page and review open funds for your diagnosis."
    );
  }

  if (f.state === "PA") {
    let vehicle = 0;
    if (f.retired === "yes") vehicle += 35;
    if (f.ownsVehicle === "yes") vehicle += 35;
    if (income * 12 <= 29000) vehicle += 20;
    if (age >= 65) vehicle += 10;
    add(items, "PA Retired Person Vehicle Registration", "Pennsylvania", "Transportation savings", "official",
      "Reduced retired-status vehicle registration fee for eligible retired Pennsylvanians.",
      "Vehicle registration, proof of retirement or retired status, income information, PennDOT form.",
      "https://www.pa.gov/services/dmv/apply-for-retired-status-vehicle-registration", vehicle,
      "Matched because retired status, vehicle ownership, income, and age all make this more relevant.",
      ["Retired status", "Vehicle ownership", "Income amount", "PennDOT form"],
      "Open the PennDOT page and gather the retired-status registration form and income proof."
    );
  }

  return items.map(item => {
    const label = item.score === 100 && item.sourceType === "official"
      ? "Definitely worth checking"
      : scoreLabel(item.score, fill);
    return { ...item, label };
  }).sort((a, b) => b.score - a.score || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
function HelpText({ field }) { return WHY[field] ? <small className="helpText">{WHY[field]}</small> : null; }
function ConfidenceMeter({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  let label = "Low";
  if (pct >= 80) label = "High";
  else if (pct >= 55) label = "Medium";
  return (
    <div className="confidenceWrap">
      <div className="confidenceTop"><strong>Confidence meter</strong><span>{pct}% · {label}</span></div>
      <div className="meter"><div className="meterFill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
function DetailDrawer({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="drawerOverlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawerHeader">
          <div>
            <h3>{item.name}</h3>
            <div className="muted">{item.type} · {item.category} · {item.sourceType === "official" ? "official link" : "grant / charity"}</div>
          </div>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
        <div className="drawerSection">
          <strong>Why it matched</strong>
          <p>{item.reason}</p>
        </div>
        <div className="drawerSection">
          <strong>What this program is</strong>
          <p>{item.description}</p>
        </div>
        <div className="drawerSection">
          <strong>What is still missing</strong>
          {item.missing && item.missing.length > 0 ? item.missing.map((m, i) => <div key={i} className="listLine">• {m}</div>) : <p>No major missing items flagged.</p>}
        </div>
        <div className="drawerSection">
          <strong>Documents to gather</strong>
          <p>{item.docs}</p>
        </div>
        <div className="drawerSection">
          <strong>Next step</strong>
          <p>{item.nextStep}</p>
        </div>
        <div className="drawerFooter">
          <a href={item.link} target="_blank" rel="noreferrer">Open link</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [results, setResults] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("benefits-profiles") || "[]");
      if (Array.isArray(saved)) setProfiles(saved);
    } catch (e) {}
  }, []);
  useEffect(() => {
    if (form.dob) {
      const nextAge = ageFromDob(form.dob);
      if (nextAge && nextAge !== form.age) setForm(prev => ({ ...prev, age: nextAge }));
    }
  }, [form.dob]);

  function updateField(name, value) { setForm(prev => ({ ...prev, [name]: value })); }
  function calculate() {
    const next = buildResults(form);
    setResults(next);
    setPage(3);
    speakText(`Found ${next.length} programs.`);
  }
  function saveProfile() {
    const name = form.personName?.trim() || `Profile ${profiles.length + 1}`;
    const next = [...profiles.filter(p => p.personName !== name), { ...form, personName: name }];
    setProfiles(next);
    localStorage.setItem("benefits-profiles", JSON.stringify(next));
  }
  function loadProfile(p) { setForm(p); setResults(buildResults(p)); setPage(3); }
  function removeProfile(name) {
    const next = profiles.filter(p => p.personName !== name);
    setProfiles(next);
    localStorage.setItem("benefits-profiles", JSON.stringify(next));
  }

  const monthlyIncome = useMemo(() => totalIncome(form), [form]);
  const assets = useMemo(() => totalAssets(form), [form]);
  const fill = Math.round(completeness(form) * 100);
  const dobParts = useMemo(() => splitDobParts(form.dob), [form.dob]);
  const previewResults = useMemo(() => (results.length ? results : buildResults(form)), [results, form]);
  const flags = useMemo(() => autoFlags(form, previewResults), [form, previewResults]);
  const prompts = useMemo(() => missingInfoPrompts(form), [form]);

  const showMedicareQuestions = Number(form.age || 0) >= 65 || form.disability === "yes" || form.medicareA === "yes" || form.medicareB === "yes";
  const showCareQuestions = form.disability === "yes" || Number(form.age || 0) >= 60 || form.longTermCare === "yes";
  const showVehicleQuestions = form.state === "PA";
  const showPropertyQuestions = form.state === "PA" && form.housing === "own";

  const categories = useMemo(() => ["all", ...Array.from(new Set(previewResults.map(r => r.category)))], [previewResults]);
  const filteredResults = useMemo(() => {
    return previewResults.filter(r => (sourceFilter === "all" || r.sourceType === sourceFilter) && (categoryFilter === "all" || r.category === categoryFilter));
  }, [previewResults, sourceFilter, categoryFilter]);

  return (
    <div className="shell">
      <div className="wrap">
        <div className="hero"><div><h1>Benefits Finder Pro</h1></div></div>

        <div className="tabs">
          <button className={page===1?"active":""} onClick={() => setPage(1)}>Basic Info</button>
          <button className={page===2?"active":""} onClick={() => setPage(2)}>Eligibility Details</button>
          <button className={page===3?"active":""} onClick={() => setPage(3)}>Results</button>
        </div>

        {(page === 1 || page === 2) && prompts.length > 0 && (
          <div className="card">
            <h2>Missing information that would improve results</h2>
            <div className="promptList">{prompts.map((p, i) => <div key={i} className="promptItem">• {p}</div>)}</div>
          </div>
        )}

        {page === 1 && (
          <div className="card">
            <h2>Basic Information</h2>
            <ConfidenceMeter value={fill} />
            <label>Name</label>
            <input value={form.personName} onChange={e => updateField("personName", e.target.value)} placeholder="Example: Mary Smith" />
            <div className="row">
              <div>
                <label>Date of birth</label>
                <div className="dobRow">
                  <select
                    value={dobParts.month}
                    onChange={e => updateField("dob", buildDob(dobParts.year, e.target.value, dobParts.day))}
                  >
                    {MONTH_OPTIONS.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <select
                    value={dobParts.day}
                    onChange={e => updateField("dob", buildDob(dobParts.year, dobParts.month, e.target.value))}
                  >
                    <option value="">Day</option>
                    {DAY_OPTIONS.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                  <select
                    value={dobParts.year}
                    onChange={e => updateField("dob", buildDob(e.target.value, dobParts.month, dobParts.day))}
                  >
                    <option value="">Year</option>
                    {YEAR_OPTIONS.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <small className="helpText">Better for phones: choose month, day, and year without long scrolling.</small>
              </div>
              <div>
                <label>Age</label>
                <input type="number" value={form.age} onChange={e => updateField("age", e.target.value)} placeholder="65" />
              </div>
            </div>
            <div className="row">
              <div><label>Marital status</label><select value={form.maritalStatus} onChange={e => updateField("maritalStatus", e.target.value)}><option value="single">Single</option><option value="married">Married</option><option value="widowed">Widowed</option><option value="divorced">Divorced</option></select></div>
              <div><label>Disability</label><select value={form.disability} onChange={e => updateField("disability", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
            </div>
            <div className="row">
              <div><label>Citizenship / status</label><HelpText field="citizenStatus" /><select value={form.citizenStatus} onChange={e => updateField("citizenStatus", e.target.value)}><option value="citizen">U.S. citizen</option><option value="qualified">Qualified non-citizen</option><option value="other">Other / not sure</option></select></div>
              <div><label>Medical condition</label><HelpText field="medicalCondition" /><select value={form.medicalCondition} onChange={e => updateField("medicalCondition", e.target.value)}>{CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}</select></div>
            </div>
            <div className="row">
              <div><label>State</label><select value={form.state} onChange={e => updateField("state", e.target.value)}>{ALL_STATES.map(abbr => <option key={abbr} value={abbr}>{abbr}</option>)}</select></div>
              <div>{showVehicleQuestions && <><label>Retired</label><HelpText field="retired" /><select value={form.retired} onChange={e => updateField("retired", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></>}</div>
            </div>
            {showVehicleQuestions && (
              <div className="row">
                <div><label>Owns a vehicle</label><HelpText field="ownsVehicle" /><select value={form.ownsVehicle} onChange={e => updateField("ownsVehicle", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                <div><label>County</label><input value={form.county} onChange={e => updateField("county", e.target.value)} placeholder="Optional" /></div>
              </div>
            )}
            <div className="row"><div><label>School district</label><input value={form.schoolDistrict} onChange={e => updateField("schoolDistrict", e.target.value)} placeholder="Optional" /></div><div></div></div>
            <div className="actions stickyActions"><button className="primaryAction" onClick={() => setPage(2)}>Next</button><button className="secondary" onClick={saveProfile}>Save profile</button></div>
          </div>
        )}

        {page === 2 && (
          <div className="card">
            <h2>Eligibility Details</h2>
            <ConfidenceMeter value={fill} />
            <div className="row">
              <div><label>Household size</label><input type="number" value={form.householdSize} onChange={e => updateField("householdSize", e.target.value)} /></div>
              <div><label>Housing</label><select value={form.housing} onChange={e => updateField("housing", e.target.value)}><option value="rent">Rent</option><option value="own">Own</option><option value="live_with_family">Live with family</option></select></div>
            </div>
            <div className="row">
              <div><label>Primary residence</label><select value={form.primaryResidence} onChange={e => updateField("primaryResidence", e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
              <div><label>Utilities separate</label><select value={form.utilitiesSeparate} onChange={e => updateField("utilitiesSeparate", e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
            </div>
            {showCareQuestions && (
              <>
                <div className="row">
                  <div><label>Needs help with daily living</label><HelpText field="needsHelpDailyLiving" /><select value={form.needsHelpDailyLiving} onChange={e => updateField("needsHelpDailyLiving", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                  <div><label>Needs supervision</label><HelpText field="needsSupervision" /><select value={form.needsSupervision} onChange={e => updateField("needsSupervision", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                </div>
                <div className="row">
                  <div><label>Cannot live alone</label><HelpText field="cannotLiveAlone" /><select value={form.cannotLiveAlone} onChange={e => updateField("cannotLiveAlone", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                  <div><label>Nursing facility level of care</label><HelpText field="nursingFacilityLevelCare" /><select value={form.nursingFacilityLevelCare} onChange={e => updateField("nursingFacilityLevelCare", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                </div>
              </>
            )}
            <label>Monthly income by source</label>
            <div className="grid3">
              <input type="number" value={form.monthlySocialSecurity} onChange={e => updateField("monthlySocialSecurity", e.target.value)} placeholder="Social Security" />
              <input type="number" value={form.monthlySSI} onChange={e => updateField("monthlySSI", e.target.value)} placeholder="SSI" />
              <input type="number" value={form.monthlySSDI} onChange={e => updateField("monthlySSDI", e.target.value)} placeholder="SSDI" />
              <input type="number" value={form.monthlyPension} onChange={e => updateField("monthlyPension", e.target.value)} placeholder="Pension" />
              <input type="number" value={form.monthlyWages} onChange={e => updateField("monthlyWages", e.target.value)} placeholder="Wages" />
              <input type="number" value={form.monthlyInterest} onChange={e => updateField("monthlyInterest", e.target.value)} placeholder="Interest / Other" />
            </div>
            <label>Assets</label>
            <div className="grid3">
              <div><HelpText field="checkingBalance" /><input type="number" value={form.checkingBalance} onChange={e => updateField("checkingBalance", e.target.value)} placeholder="Checking" /></div>
              <div><HelpText field="savingsBalance" /><input type="number" value={form.savingsBalance} onChange={e => updateField("savingsBalance", e.target.value)} placeholder="Savings" /></div>
              <div><input type="number" value={form.otherAssets} onChange={e => updateField("otherAssets", e.target.value)} placeholder="Other assets" /></div>
            </div>
            <div className="row">
              <div><label>Monthly rent / mortgage</label><input type="number" value={form.monthlyRentMortgage} onChange={e => updateField("monthlyRentMortgage", e.target.value)} /></div>
              {showPropertyQuestions && <div><label>Property taxes paid yearly</label><input type="number" value={form.propertyTaxesPaid} onChange={e => updateField("propertyTaxesPaid", e.target.value)} /></div>}
            </div>
            {showMedicareQuestions && (
              <>
                <div className="row">
                  <div><label>Medicare A</label><HelpText field="medicareA" /><select value={form.medicareA} onChange={e => updateField("medicareA", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                  <div><label>Medicare B</label><HelpText field="medicareB" /><select value={form.medicareB} onChange={e => updateField("medicareB", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                </div>
                <div className="row">
                  <div><label>Medicare D</label><HelpText field="medicareD" /><select value={form.medicareD} onChange={e => updateField("medicareD", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                  <div><label>Medicaid active</label><HelpText field="medicaid" /><select value={form.medicaid} onChange={e => updateField("medicaid", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                </div>
                <div className="row">
                  <div><label>Prescription costs per month</label><HelpText field="prescriptionCosts" /><input type="number" value={form.prescriptionCosts} onChange={e => updateField("prescriptionCosts", e.target.value)} /></div>
                  <div><label>Long-term care / home care need</label><select value={form.longTermCare} onChange={e => updateField("longTermCare", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                </div>
              </>
            )}
            <div className="summary">
              <div><strong>Total monthly income:</strong> {currency(monthlyIncome)}</div>
              <div><strong>Total assets:</strong> {currency(assets)}</div>
              <div><strong>Info entered:</strong> {fill}%</div>
            </div>
            <div className="actions stickyActions"><button className="secondary" onClick={() => setPage(1)}>Back</button><button className="primaryAction" onClick={calculate}>Find benefits</button><button className="secondary" onClick={saveProfile}>Save profile</button></div>
          </div>
        )}

        {page === 3 && (
          <div className="card">
            <h2>Results</h2>
            <ConfidenceMeter value={fill} />
            {prompts.length > 0 && <div className="flags"><strong>Missing information that would improve accuracy</strong>{prompts.map((p, i) => <div key={i} className="flagItem">• {p}</div>)}</div>}
            {flags.length > 0 && <div className="flags"><strong>Auto flags</strong>{flags.map((flag, i) => <div key={i} className="flagItem">• {flag}</div>)}</div>}

            <div className="filterBar">
              <div><label>Result source</label><select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}><option value="all">All results</option><option value="official">Official links only</option><option value="charity">Grant / charity only</option></select></div>
              <div><label>Result type</label><select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>{categories.map(cat => <option key={cat} value={cat}>{cat === "all" ? "All types" : cat}</option>)}</select></div>
            </div>

            <div className="actions"><button className="secondary" onClick={() => setPage(1)}>Edit info</button><button className="secondary" onClick={() => window.print()}>Print</button></div>

            {filteredResults.length === 0 ? <div className="empty">No results match the current filters.</div> : filteredResults.map((item, i) => (
              <div key={i} className="result">
                <div className="resultTop">
                  <h3>{item.name}</h3>
                  <span className={`badge ${item.label.toLowerCase().replace(/\s+/g, "-")}`}>{item.label}</span>
                </div>
                <div className="muted">{item.type} · {item.category} · {item.sourceType === "official" ? "official link" : "grant / charity"}</div>
                <p>{item.description}</p>
                <p><strong>Match score:</strong> {item.score}/100</p>
                <div className="resultButtons">
                  <button className="secondary" onClick={() => setSelectedItem(item)}>Program details</button>
                  <a href={item.link} target="_blank" rel="noreferrer">Open link</a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h2>Saved profiles</h2>
          {profiles.length === 0 ? <div className="empty">No saved profiles yet.</div> : profiles.map((p, i) => (
            <div key={i} className="saved">
              <div>
                <strong>{p.personName || `Profile ${i+1}`}</strong>
                <div className="muted">{p.state} · Age {p.age || "—"} · Income {currency([
                  p.monthlySocialSecurity,p.monthlySSI,p.monthlySSDI,p.monthlyPension,p.monthlyWages,p.monthlyInterest,p.monthlyOtherIncome
                ].reduce((a,b)=>a+Number(b||0),0))}</div>
              </div>
              <div className="miniActions">
                <button className="secondary" onClick={() => loadProfile(p)}>Load</button>
                <button className="danger" onClick={() => removeProfile(p.personName)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <DetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      </div>
    </div>
  );
}
