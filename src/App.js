
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
  veteran: "Why this matters: Veteran status can unlock VA pension, healthcare, and other veteran-specific programs.",
  needsHelpDailyLiving: "Why this matters: Helps find programs that pay for in-home care or assistance.",
  needsSupervision: "Why this matters: Some programs require supervision needs to qualify for care services.",
  cannotLiveAlone: "Why this matters: This helps determine eligibility for housing or care programs like Domiciliary Care.",
  nursingFacilityLevelCare: "Why this matters: Required for certain programs that provide long-term care at home instead of a nursing home.",
  medicareA: "Why this matters: Determines if you may qualify for programs that lower Medicare costs.",
  medicareB: "Why this matters: Determines if you may qualify for programs that lower Medicare costs.",
  medicareD: "Why this matters: Helps find prescription savings programs.",
  medicaid: "Why this matters: Some programs only apply if you already have Medicaid.",
  receivingSNAP: "Why this matters: Current SNAP enrollment is a strong indicator of food assistance eligibility.",
  receivingSSI: "Why this matters: Current SSI enrollment indicates eligibility for low-income cash and medical supports.",
  receivingSSDI: "Why this matters: Current SSDI enrollment indicates a disability benefit pathway.",
  receivingOtherBenefits: "Why this matters: Include other benefits such as Medicaid, public housing, LIHEAP, veterans assistance, or utility discounts.",
  prescriptionCosts: "Why this matters: Helps find programs that reduce medication expenses.",
  retired: "Why this matters: Required for reduced vehicle registration fees in Pennsylvania.",
  ownsVehicle: "Why this matters: Needed to check eligibility for vehicle-related savings.",
  checkingBalance: "Why this matters: Some programs have resource or asset limits.",
  savingsBalance: "Why this matters: Some programs have resource or asset limits."
};

const emptyForm = {
  personName: "", dob: "", age: "", maritalStatus: "single", disability: "no", veteran: "no",
  citizenStatus: "citizen", state: "PA", county: "", schoolDistrict: "",
  householdSize: "1", livesAlone: "yes", needsSupervision: "no", cannotLiveAlone: "no",
  needsHelpDailyLiving: "no", nursingFacilityLevelCare: "no", housing: "rent", primaryResidence: "yes",
  monthlyRentMortgage: "", propertyTaxesPaid: "", utilitiesSeparate: "yes", monthlySocialSecurity: "",
  monthlySSI: "", monthlySSDI: "", monthlyPension: "", monthlyWages: "", monthlyInterest: "",
  monthlyOtherIncome: "", checkingBalance: "", savingsBalance: "", otherAssets: "", medicareA: "no",
  medicareB: "no", medicareD: "no", medicaid: "no", receivingSNAP: "no", receivingSSI: "no", receivingSSDI: "no", receivingOtherBenefits: "no", prescriptionCosts: "", longTermCare: "no",
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
    "checkingBalance","savingsBalance","disability","veteran","citizenStatus","medicareA","medicareB","medicareD",
    "receivingSNAP","receivingSSI","receivingSSDI","receivingOtherBenefits","needsHelpDailyLiving","needsSupervision","cannotLiveAlone","nursingFacilityLevelCare"];
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
  addPrompt("receivingSNAP", "Confirm whether you currently receive SNAP to improve food assistance screening.");
  addPrompt("receivingSSI", "Confirm whether you currently receive SSI to improve cash assistance screening.");
  addPrompt("receivingSSDI", "Confirm whether you currently receive SSDI to improve disability assistance screening.");
  addPrompt("receivingOtherBenefits", "Confirm whether you currently receive other public benefits to improve screening.");
  addPrompt("checkingBalance", "Enter checking balance to improve SSI, Medicaid, and Medicare Savings screening.");
  addPrompt("savingsBalance", "Enter savings balance to improve SSI, Medicaid, and Extra Help screening.");
  if (String(f.citizenStatus ?? "").trim() === "" || f.citizenStatus === "other") prompts.push("Confirm citizenship or qualified status to improve SNAP, SSI, and Medicaid screening.");
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
  if ((age >= 65 || f.disability === "yes") && income <= 1300 && ((f.maritalStatus === "married" && assets <= 3000) || (f.maritalStatus !== "married" && assets <= 2000))) {
    flags.push("SSI looks especially strong based on low income, age/disability, and assets entered.");
  }
  if (f.veteran === "yes") {
    flags.push("Veteran status may qualify you for VA pension, healthcare, and additional veteran services.");
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

  let ssiScore = 0;
  if (age >= 65 || f.disability === "yes") ssiScore += 35;
  if (f.receivingSSI === "yes") ssiScore = Math.max(ssiScore, 90);
  if (income <= 1300) ssiScore += 40;
  if ((f.maritalStatus === "married" && assets <= 3000) || (f.maritalStatus !== "married" && assets <= 2000)) ssiScore += 20;
  if (f.citizenStatus !== "other") ssiScore += 5;
  add(items, "SSI", "Federal", "Cash / income", "official",
    "Monthly cash assistance for older adults and people with disabilities who meet income and resource rules.",
    "Photo ID, Social Security number, citizenship or qualified status, income proof, bank balances, housing costs.",
    "https://www.ssa.gov/ssi", ssiScore,
    "Matched because age/disability, income, assets, and citizenship status are used in SSI screening.",
    ["Age 65 or older or qualifying disability", "Countable income below SSI limits", "Countable resources below SSI limits", "U.S. citizenship or qualified non-citizen status"],
    "Open the official SSI page, gather your documents, then start the SSA application or screening process."
  );

  let snapScore = 0;
  const snapLimit = 1700 + (household - 1) * 650;
  if (f.receivingSNAP === "yes") snapScore = Math.max(snapScore, 90);
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
  if (f.medicaid === "yes") medicaidScore = Math.max(medicaidScore, 90);
  if (income <= 1800) medicaidScore += 30;
  if (assets <= 10000) medicaidScore += 20;
  if (f.citizenStatus !== "other") medicaidScore += 5;
  if (f.longTermCare === "yes" || f.needsHelpDailyLiving === "yes") medicaidScore += 10;
  add(items, "Medicaid (Disability Path)", "Federal / State", "Medical / disability support", "official",
    "Medical coverage pathway commonly used by younger people with disabilities and adults with care needs.",
    "ID, citizenship or qualified status, medical records, income proof, bank balances, disability information.",
    STATES[f.state]?.portal || "https://www.medicaid.gov/", medicaidScore,
    "Matched because disability, age, income, assets, and care needs all strengthen Medicaid screening.",
    ["Age 65+ or qualifying disability or medical need", "Income below your state Medicaid limit", "Assets below your state resource limit", "U.S. citizenship or qualified non-citizen status"],
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
      ["Enrollment in Medicare Part A or B", "Income below your state’s MSP limit", "Assets within your state’s MSP resource limit", "U.S. citizenship or qualified non-citizen status"],
      "Open the official Medicare Savings page, then apply through the state Medicaid office or portal."
    );

    let extraHelp = 0;
    if (f.medicareD === "yes" || f.medicareA === "yes" || f.medicareB === "yes") extraHelp += 25;
    if (income <= 2400) extraHelp += 40;
    if (assets <= 17000) extraHelp += 20;
    if (Number(f.prescriptionCosts || 0) > 0) extraHelp += 15;
    add(items, "Extra Help for Prescriptions", "Federal", "Medical / prescription savings", "official",
      "Help paying Medicare Part D prescription costs.",
      "Medicare information, citizenship or qualified status, prescription list, income and resource details.",
      "https://www.ssa.gov/extrahelp", extraHelp,
      "Matched because Medicare drug coverage, prescription costs, income, and assets matter for Extra Help.",
      ["Enrollment in Medicare Part D", "Income within Extra Help limits", "Resources within Extra Help resource limits", "Prescription costs that make Part D unaffordable"],
      "Open the official Extra Help page and gather your Medicare and prescription information before applying."
    );

    if (age >= 62) {
      let ssRetirement = 60;
      if (age >= 65) ssRetirement += 30;
      if (f.maritalStatus === "married") ssRetirement += 10;
      add(items, "Social Security Retirement Benefits", "Federal", "Cash / income", "official",
        "Monthly retirement benefits based on your work history and earnings record.",
        "Birth certificate, Social Security number, work history, marriage or divorce records if applicable.",
        "https://www.ssa.gov/benefits/retirement/", ssRetirement,
        "Matched because age 62 or older may qualify for Social Security retirement benefits.",
        ["Proof of age", "Social Security number", "Work history documentation"],
        "Open the official SSA retirement page to estimate benefits and start your application."
      );
    }

    if (f.disability === "yes" || f.receivingSSDI === "yes") {
      let ssdi = 50;
      if (Number(f.monthlySSDI || 0) > 0 || f.receivingSSDI === "yes") ssdi = 100;
      add(items, "Social Security Disability Insurance (SSDI)", "Federal", "Cash / income", "official",
        "Monthly cash benefits for people with disabilities who have paid into Social Security.",
        "Recent medical records, work history, Social Security number, income proof.",
        "https://www.ssa.gov/benefits/disability/", ssdi,
        "Matched because disability status may qualify for SSDI when work credits and medical evidence are present.",
        ["Qualifying disability that prevents substantial gainful activity", "Sufficient Social Security work credits", "Recent medical evidence of the disability"],
        "Open the official SSDI page and review disability application requirements."
      );
    }

    let liheapScore = 0;
    if (income <= 2500) liheapScore += 50;
    if (f.housing === "rent" || f.utilitiesSeparate === "yes") liheapScore += 25;
    if (age >= 60 || f.disability === "yes") liheapScore += 15;
    add(items, "LIHEAP Energy Assistance", "Federal / State", "Utilities / energy", "official",
      "Helps pay heating and cooling bills, weatherization, or home energy repairs for low-income households.",
      "Income proof, utility bills, ID, Social Security numbers for household members.",
      "https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap", liheapScore,
      "Matched because low household income and utility responsibility may qualify for LIHEAP.",
      ["Household income below state LIHEAP limits", "Responsibility for home heating or cooling bills", "Residency in the state offering LIHEAP"],
      "Open the LIHEAP page and locate your state agency to apply." 
    );

    let section8Score = 0;
    if (f.housing === "rent" || f.housing === "live_with_family") section8Score += 60;
    if (income <= 3000) section8Score += 25;
    if (household > 1) section8Score += 15;
    add(items, "Section 8 Housing Choice Voucher", "Federal", "Housing", "official",
      "Rent assistance vouchers for eligible low-income households, including seniors and people with disabilities.",
      "Income proof, ID, household size, current rent or lease agreement.",
      "https://www.hud.gov/topics/housing_choice_voucher_program_section_8", section8Score,
      "Matched because low income and rental housing often qualify applicants for housing choice vouchers.",
      ["Income below area median income limits", "Need for rental housing assistance", "Household size and composition"],
      "Open the HUD Section 8 page and contact your local public housing agency to learn about applications."
    );

    if (f.veteran === "yes") {
      let vaScore = 75;
      if (age >= 65) vaScore += 10;
      if (f.disability === "yes") vaScore += 10;
      add(items, "VA Benefits & Pension", "Federal", "Veteran support", "official",
        "VA health care, disability compensation, pension, and other benefits for eligible veterans.",
        "DD214 or separation papers, income and net worth documentation, medical records if applying for pension or disability.",
        "https://www.va.gov/benefits/", vaScore,
        "Matched because veteran status can unlock VA pension, health, and disability benefits.",
        ["Veteran status with qualifying service record", "Qualifying discharge status", "Income and net worth within VA pension limits"],
        "Open the VA benefits page and review your eligibility for VA pension, healthcare, and disability support."
      );
    }

  }

  const statePortal = STATES[f.state]?.portal || "https://www.benefits.gov/benefit-finder";
  const stateUnclaimed = STATES[f.state]?.unclaimed || "https://www.missingmoney.com/";
  add(items, `${f.state} State Benefits Portal`, "State", "General state help", "official",
    "Official state portal for food, medical, cash, utility, and other support programs.",
    "ID, address, income proof, household size.", statePortal, 100,
    "This is an official entry point for your state’s benefit programs.",
    ["Residency in the selected state", "Basic identity information", "Household size and income details"],
    "Open the official portal and review the benefit categories that match your situation."
  );
  add(items, "MissingMoney.com", "Federal / State", "Unclaimed money", "official",
    "Free nationwide search for unclaimed property across all 50 states.",
    "Your full legal name and prior addresses, if available.",
    "https://www.missingmoney.com/", 100,
    "Matched because anyone can have unclaimed property, regardless of income, age, or benefits status.",
    ["Anyone can search for unclaimed property", "No income or age requirement", "Your name and prior addresses"],
    "Open MissingMoney.com and search your name across all participating states."
  );
  add(items, `${f.state} Unclaimed Money`, "State", "Unclaimed money", "official",
    "Search for unclaimed money, dormant accounts, old refunds, or property owed to you.",
    "Your name and current or past address.", stateUnclaimed, 100,
    "This is worth checking because unclaimed property searches do not depend on income eligibility.",
    ["A name or address match in the unclaimed property database", "Proof of identity to claim found assets"],
    "Open the official unclaimed property search and try your name plus previous addresses."
  );

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
      ["Pennsylvania residency", "Age 65 or older", "Retired status", "Vehicle ownership and registration eligibility"],
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
          <strong>What you need to qualify</strong>
          <p>This is the eligibility criteria the program typically requires. If you meet these conditions, the benefit is worth pursuing.</p>
          {item.missing && item.missing.length > 0 ? item.missing.map((m, i) => <div key={i} className="listLine">• {m}</div>) : <p>No major eligibility criteria flagged.</p>}
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
  const [selectedProfileName, setSelectedProfileName] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
    setSelectedProfileName(name);
    localStorage.setItem("benefits-profiles", JSON.stringify(next));
  }
  function loadProfile(p) { setForm(p); setResults(buildResults(p)); setPage(3); setSelectedProfileName(p.personName || ""); setProfileMenuOpen(false); }
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
  const benefitSummary = useMemo(() => {
    const official = previewResults.filter(r => r.sourceType === "official");
    return {
      likely: official.filter(r => r.score >= 90),
      apply: official.filter(r => r.score >= 55 && r.score < 90)
    };
  }, [previewResults]);

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
        <div className="topBar">
          <div className="topBarHeader">
            <div className="hero"><div><h1>Benefits Finder Pro</h1></div></div>
            <div className="profileArea">
              <button className="profileButton" onClick={() => setProfileMenuOpen(prev => !prev)}>{selectedProfileName || "No profile loaded"}</button>
              {profileMenuOpen && (
                <div className="profileDropdown">
                  <div className="profileDropdownHeader">Saved profiles</div>
                  {profiles.length === 0 ? (
                    <div className="empty">No saved profiles yet.</div>
                  ) : profiles.map((p, i) => (
                    <button key={i} className="profileDropdownItem" onClick={() => loadProfile(p)}>{p.personName || `Profile ${i + 1}`}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="tabs">
            <button className={page===1?"active":""} onClick={() => setPage(1)}>Basic Info</button>
            <button className={page===2?"active":""} onClick={() => setPage(2)}>Eligibility Details</button>
            <button className={page===3?"active":""} onClick={() => setPage(3)}>Results</button>
          </div>
        </div>
        {profileMenuOpen && <div className="dropdownBackdrop" onClick={() => setProfileMenuOpen(false)} />}

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
              <div><label>Veteran status</label><HelpText field="veteran" /><select value={form.veteran} onChange={e => updateField("veteran", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
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
            <div className="row">
              <div><label>Currently receive SNAP</label><HelpText field="receivingSNAP" /><select value={form.receivingSNAP} onChange={e => updateField("receivingSNAP", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
              <div><label>Currently receive SSI</label><HelpText field="receivingSSI" /><select value={form.receivingSSI} onChange={e => updateField("receivingSSI", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
            </div>
            <div className="row">
              <div><label>Currently receive SSDI</label><HelpText field="receivingSSDI" /><select value={form.receivingSSDI} onChange={e => updateField("receivingSSDI", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
              <div><label>Other public benefits</label><HelpText field="receivingOtherBenefits" /><select value={form.receivingOtherBenefits} onChange={e => updateField("receivingOtherBenefits", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
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
            <div className="summaryCard">
              <h3>Quick benefit summary</h3>
              <div className="flagItem">{form.receivingOtherBenefits === "yes" ? "You have reported other public benefits; review the listed programs for supplemental support." : "No other public benefits are recorded; answer the field to improve your screening."}</div>
              <div className="flagItem">Programs likely already relevant: {benefitSummary.likely.length}</div>
              <div className="flagItem">Programs still worth applying for: {benefitSummary.apply.length}</div>
            </div>

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
