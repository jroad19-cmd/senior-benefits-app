
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
  savingsBalance: "Why this matters: Some programs have resource or asset limits."
};

const emptyForm = {
  personName: "",
  dob: "",
  age: "",
  maritalStatus: "single",
  disability: "no",
  veteran: "no",
  citizenStatus: "citizen",
  state: "PA",
  county: "",
  schoolDistrict: "",
  householdSize: "1",
  livesAlone: "yes",
  needsSupervision: "no",
  cannotLiveAlone: "no",
  needsHelpDailyLiving: "no",
  nursingFacilityLevelCare: "no",
  housing: "rent",
  primaryResidence: "yes",
  monthlyRentMortgage: "",
  propertyTaxesPaid: "",
  utilitiesSeparate: "yes",
  monthlySocialSecurity: "",
  monthlySSI: "",
  monthlySSDI: "",
  monthlyPension: "",
  monthlyWages: "",
  monthlyInterest: "",
  monthlyOtherIncome: "",
  checkingBalance: "",
  savingsBalance: "",
  otherAssets: "",
  medicareA: "no",
  medicareB: "no",
  medicareD: "no",
  medicaid: "no",
  prescriptionCosts: "",
  longTermCare: "no",
  retired: "no",
  ownsVehicle: "no"
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
  const keys = [
    "age","state","householdSize","housing","primaryResidence","monthlySocialSecurity","monthlySSI","monthlySSDI",
    "checkingBalance","savingsBalance","disability","citizenStatus","medicareA","medicareB","medicareD",
    "needsHelpDailyLiving","needsSupervision","cannotLiveAlone","nursingFacilityLevelCare"
  ];
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

function add(items, name, type, category, description, docs, link, score) {
  items.push({ name, type, category, description, docs, link, score });
}

function missingInfoPrompts(f) {
  const prompts = [];
  const age = Number(f.age || 0);
  const medicareRelevant = age >= 65 || f.disability === "yes" || f.medicareA === "yes" || f.medicareB === "yes";
  const careRelevant = f.disability === "yes" || age >= 60 || f.longTermCare === "yes";
  const paRelevant = f.state === "PA";

  const addPrompt = (field, text) => {
    if (String(f[field] ?? "").trim() === "") prompts.push(text);
  };

  addPrompt("age", "Add age or date of birth to improve nearly every result.");
  addPrompt("householdSize", "Add household size to tighten SNAP screening.");
  addPrompt("monthlySocialSecurity", "Enter Social Security income, even if it is $0.");
  addPrompt("monthlySSI", "Enter SSI income, even if it is $0.");
  addPrompt("monthlySSDI", "Enter SSDI income, even if it is $0.");
  addPrompt("checkingBalance", "Enter checking balance to improve SSI, Medicaid, and Medicare Savings screening.");
  addPrompt("savingsBalance", "Enter savings balance to improve SSI, Medicaid, and Extra Help screening.");
  if (String(f.citizenStatus ?? "").trim() === "" || f.citizenStatus === "other") prompts.push("Confirm citizenship or qualified status to improve SNAP, SSI, and Medicaid screening.");
  if (medicareRelevant) {
    if (String(f.medicareA ?? "").trim() === "") prompts.push("Answer Medicare Part A to improve Medicare Savings screening.");
    if (String(f.medicareB ?? "").trim() === "") prompts.push("Answer Medicare Part B to improve Medicare Savings screening.");
    if (String(f.medicareD ?? "").trim() === "") prompts.push("Answer Medicare Part D to improve Extra Help screening.");
    addPrompt("prescriptionCosts", "Enter prescription costs to improve Extra Help and prescription savings results.");
  }
  if (careRelevant) {
    if (String(f.needsHelpDailyLiving ?? "").trim() === "" || f.needsHelpDailyLiving === "no") prompts.push("If help with daily living is needed, answer that to improve home-care and CHC results.");
    if (String(f.needsSupervision ?? "").trim() === "" || f.needsSupervision === "no") prompts.push("If supervision is needed, answer that to improve Domiciliary Care results.");
    if (String(f.cannotLiveAlone ?? "").trim() === "" || f.cannotLiveAlone === "no") prompts.push("If the person cannot live alone, answer that to improve supportive-living results.");
    if (String(f.nursingFacilityLevelCare ?? "").trim() === "" || f.nursingFacilityLevelCare === "no") prompts.push("If nursing-facility level of care applies, answer that to improve CHC and waiver results.");
  }
  if (paRelevant && f.housing === "own") {
    addPrompt("propertyTaxesPaid", "Enter yearly property taxes paid to improve PA tax-relief results.");
    addPrompt("schoolDistrict", "Enter school district to improve PA Homestead / Farmstead Exclusion guidance.");
  }
  if (paRelevant) {
    if (f.retired === "yes" && String(f.ownsVehicle ?? "").trim() === "") prompts.push("Answer vehicle ownership to improve PA retired registration results.");
    if (f.ownsVehicle === "yes" && String(f.retired ?? "").trim() === "") prompts.push("Answer retired status to improve PA retired registration results.");
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
  if (f.disability === "yes" && income <= 2200 && assets <= 10000) {
    flags.push("Disability-based Medicaid looks especially strong based on the information entered.");
  }
  if ((f.medicareA === "yes" || f.medicareB === "yes") && income <= 2200 && assets <= 10000) {
    flags.push("Medicare Savings Programs look especially strong based on Medicare status, income, and assets.");
  }
  if ((f.medicareD === "yes" || f.medicareA === "yes" || f.medicareB === "yes") && income <= 2500 && Number(f.prescriptionCosts || 0) > 0) {
    flags.push("Extra Help for Prescriptions looks especially strong based on Medicare and prescription costs.");
  }
  if (f.state === "PA" && f.retired === "yes" && f.ownsVehicle === "yes") {
    flags.push("PA retired vehicle registration reduction is worth checking now.");
  }
  if (f.state === "PA" && (f.needsSupervision === "yes" || f.cannotLiveAlone === "yes")) {
    flags.push("PA Domiciliary Care may be a strong fit because supervision or inability to live alone was selected.");
  }
  if (f.state === "PA" && f.medicaid === "yes" && (f.medicareA === "yes" || f.medicareB === "yes") && (f.longTermCare === "yes" || f.nursingFacilityLevelCare === "yes")) {
    flags.push("PA Community HealthChoices may be a strong fit because Medicaid, Medicare, and care-need details were selected.");
  }
  if (results.filter(r => r.label === "Definitely worth applying").length >= 2) {
    flags.push("Multiple programs scored at the highest level. Review those first.");
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
  if (income <= 1971) ssiScore += 40;
  if ((f.maritalStatus === "married" && assets <= 3000) || (f.maritalStatus !== "married" && assets <= 2000)) ssiScore += 20;
  if (f.citizenStatus !== "other") ssiScore += 5;
  add(items, "SSI", "Federal", "Cash / income", "Monthly cash assistance for older adults and people with disabilities who meet income and resource rules.", "Photo ID, Social Security number, citizenship or qualified status, income proof, bank balances, housing costs.", "https://www.ssa.gov/ssi", ssiScore);

  let snapScore = 0;
  const snapLimit = 2550 + (household - 1) * 900;
  if (income <= snapLimit) snapScore += 70;
  if (f.housing === "rent" || Number(f.monthlyRentMortgage || 0) > 0) snapScore += 15;
  if (f.utilitiesSeparate === "yes") snapScore += 10;
  if (f.citizenStatus !== "other") snapScore += 5;
  add(items, "SNAP", "Federal", "Food", "Monthly grocery help based on income and household size.", "ID, citizenship or qualified status, income proof, rent or mortgage, utility bills, household members.", "https://www.fns.usda.gov/snap", snapScore);

  let medicaidScore = 0;
  if (f.disability === "yes" || age >= 65) medicaidScore += 35;
  if (income <= 2200) medicaidScore += 30;
  if (assets <= 10000) medicaidScore += 20;
  if (f.citizenStatus !== "other") medicaidScore += 5;
  if (f.longTermCare === "yes" || f.needsHelpDailyLiving === "yes") medicaidScore += 10;
  add(items, "Medicaid (Disability Path)", "Federal / State", "Medical / disability support", "Medical coverage pathway commonly used by younger people with disabilities and adults with care needs.", "ID, citizenship or qualified status, medical records, income proof, bank balances, disability information.", STATES[f.state]?.portal || "https://www.medicaid.gov/", medicaidScore);

  if (age >= 65 || f.disability === "yes" || f.medicareA === "yes" || f.medicareB === "yes") {
    let msp = 0;
    if (f.medicareA === "yes" || f.medicareB === "yes") msp += 30;
    if (income <= 2200) msp += 40;
    if (assets <= 10000) msp += 20;
    if (f.citizenStatus !== "other") msp += 10;
    add(items, "Medicare Savings Programs", "Federal / State", "Medical / prescription savings", "Help paying Medicare premiums and sometimes deductibles or copays.", "Medicare card, ID, citizenship or qualified status, income proof, bank balances.", "https://www.medicare.gov/basics/costs/help/medicare-savings-programs", msp);

    let extraHelp = 0;
    if (f.medicareD === "yes" || f.medicareA === "yes" || f.medicareB === "yes") extraHelp += 25;
    if (income <= 2500) extraHelp += 40;
    if (assets <= 18000) extraHelp += 20;
    if (Number(f.prescriptionCosts || 0) > 0) extraHelp += 15;
    add(items, "Extra Help for Prescriptions", "Federal", "Medical / prescription savings", "Help paying Medicare Part D prescription costs.", "Medicare information, citizenship or qualified status, prescription list, income and resource details.", "https://www.ssa.gov/extrahelp", extraHelp);
  }

  const statePortal = STATES[f.state]?.portal || "https://www.benefits.gov/benefit-finder";
  const stateUnclaimed = STATES[f.state]?.unclaimed || "https://www.missingmoney.com/";
  add(items, `${f.state} State Benefits Portal`, "State", "General state help", "Official state portal for food, medical, cash, utility, and other support programs.", "ID, address, income proof, household size.", statePortal, 100);
  add(items, `${f.state} Unclaimed Money`, "State", "Unclaimed money", "Search for unclaimed money, dormant accounts, old refunds, or property owed to you.", "Your name and current or past address.", stateUnclaimed, 100);

  if (f.state === "PA") {
    let domiciliary = 0;
    if (f.needsSupervision === "yes") domiciliary += 30;
    if (f.cannotLiveAlone === "yes") domiciliary += 30;
    if (f.longTermCare === "yes" || f.needsHelpDailyLiving === "yes") domiciliary += 20;
    if (income <= 3500) domiciliary += 10;
    if (f.citizenStatus !== "other") domiciliary += 10;
    add(items, "PA Domiciliary Care", "Pennsylvania", "Housing / supportive living", "Family-like home setting for adults who need supervision and support and cannot live alone.", "Functional needs, supervision needs, inability to live alone, income details, contact information, care assessment.", "https://www.pa.gov/agencies/aging/aging-programs-and-services/housing-programs-for-older-adults", domiciliary);

    let olderDisabledMedicaid = 0;
    if (f.disability === "yes" || age >= 65) olderDisabledMedicaid += 40;
    if (income <= 2200) olderDisabledMedicaid += 30;
    if (assets <= 10000) olderDisabledMedicaid += 20;
    if (f.citizenStatus !== "other") olderDisabledMedicaid += 10;
    add(items, "PA Medicaid for Older Adults and People with Disabilities", "Pennsylvania", "Medical / disability support", "Pennsylvania Medicaid category for older adults and people with disabilities.", "Income proof, bank balances, ID, citizenship or qualified status, medical or disability information.", "https://www.pa.gov/agencies/dhs/resources/aging-physical-disabilities/medicaid-older-people-and-people-with-disabilities", olderDisabledMedicaid);

    let chc = 0;
    if (f.medicaid === "yes" && (f.medicareA === "yes" || f.medicareB === "yes")) chc += 45;
    if (f.disability === "yes" && age >= 21) chc += 20;
    if (f.longTermCare === "yes" || f.nursingFacilityLevelCare === "yes") chc += 25;
    if (f.needsHelpDailyLiving === "yes") chc += 10;
    add(items, "PA Community HealthChoices (CHC)", "Pennsylvania", "Care at home / disability support", "Managed long-term services and supports for dual-eligible adults and adults with physical disabilities.", "Medicaid and Medicare information, care needs, nursing facility level of care if applicable, medical records.", "https://www.pa.gov/agencies/dhs/resources/medicaid/chc/chc-providers", chc);

    let vehicle = 0;
    if (f.retired === "yes") vehicle += 35;
    if (f.ownsVehicle === "yes") vehicle += 35;
    if (income * 12 <= 29000) vehicle += 20;
    if (age >= 65) vehicle += 10;
    add(items, "PA Retired Person Vehicle Registration", "Pennsylvania", "Transportation savings", "Reduced retired-status vehicle registration fee for eligible retired Pennsylvanians.", "Vehicle registration, proof of retirement or retired status, income information, PennDOT form.", "https://www.pa.gov/services/dmv/apply-for-retired-status-vehicle-registration", vehicle);

    add(items, "PA MEDI", "Pennsylvania", "Medical / prescription savings", "Free Medicare counseling that can help compare plans, avoid penalties, and reduce out-of-pocket costs.", "Medicare card, current plan information, medication list.", "https://www.pa.gov/agencies/aging/aging-programs-and-services/pa-medi-medicare-counseling", 100);
  }

  return items.map(item => {
    const label = item.score === 100 && (item.name.includes("Portal") || item.name.includes("Unclaimed") || item.name === "PA MEDI")
      ? "Definitely worth checking"
      : scoreLabel(item.score, fill);
    return { ...item, label };
  }).sort((a, b) => b.score - a.score || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

function HelpText({ field }) {
  return WHY[field] ? <small className="helpText">{WHY[field]}</small> : null;
}

function ConfidenceMeter({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  let label = "Low";
  if (pct >= 80) label = "High";
  else if (pct >= 55) label = "Medium";
  return (
    <div className="confidenceWrap">
      <div className="confidenceTop">
        <strong>Confidence meter</strong>
        <span>{pct}% · {label}</span>
      </div>
      <div className="meter">
        <div className="meterFill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [results, setResults] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [page, setPage] = useState(1);

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

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

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

  function loadProfile(p) {
    setForm(p);
    setResults(buildResults(p));
    setPage(3);
  }

  function removeProfile(name) {
    const next = profiles.filter(p => p.personName !== name);
    setProfiles(next);
    localStorage.setItem("benefits-profiles", JSON.stringify(next));
  }

  const monthlyIncome = useMemo(() => totalIncome(form), [form]);
  const assets = useMemo(() => totalAssets(form), [form]);
  const fill = Math.round(completeness(form) * 100);
  const previewResults = useMemo(() => (results.length ? results : buildResults(form)), [results, form]);
  const flags = useMemo(() => autoFlags(form, previewResults), [form, previewResults]);
  const prompts = useMemo(() => missingInfoPrompts(form), [form]);

  const showMedicareQuestions = Number(form.age || 0) >= 65 || form.disability === "yes" || form.medicareA === "yes" || form.medicareB === "yes";
  const showCareQuestions = form.disability === "yes" || Number(form.age || 0) >= 60 || form.longTermCare === "yes";
  const showVehicleQuestions = form.state === "PA";
  const showPropertyQuestions = form.state === "PA" && form.housing === "own";

  return (
    <div className="shell">
      <div className="wrap">
        <div className="hero">
          <div>
            <h1>Benefits Finder Pro</h1>
            <p>Now includes missing-info prompts that tell the user exactly what to answer next to improve accuracy.</p>
          </div>
        </div>

        <div className="tabs">
          <button className={page===1?"active":""} onClick={() => setPage(1)}>Basic Info</button>
          <button className={page===2?"active":""} onClick={() => setPage(2)}>Eligibility Details</button>
          <button className={page===3?"active":""} onClick={() => setPage(3)}>Results</button>
        </div>

        {(page === 1 || page === 2) && prompts.length > 0 && (
          <div className="card">
            <h2>Missing information that would improve results</h2>
            <div className="promptList">
              {prompts.map((p, i) => <div key={i} className="promptItem">• {p}</div>)}
            </div>
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
                <input type="date" value={form.dob} onChange={e => updateField("dob", e.target.value)} />
              </div>
              <div>
                <label>Age</label>
                <input type="number" value={form.age} onChange={e => updateField("age", e.target.value)} placeholder="65" />
              </div>
            </div>

            <div className="row">
              <div>
                <label>Marital status</label>
                <select value={form.maritalStatus} onChange={e => updateField("maritalStatus", e.target.value)}>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label>Disability</label>
                <select value={form.disability} onChange={e => updateField("disability", e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div>
                <label>Citizenship / status</label>
                <HelpText field="citizenStatus" />
                <select value={form.citizenStatus} onChange={e => updateField("citizenStatus", e.target.value)}>
                  <option value="citizen">U.S. citizen</option>
                  <option value="qualified">Qualified non-citizen</option>
                  <option value="other">Other / not sure</option>
                </select>
              </div>
              <div>
                <label>State</label>
                <select value={form.state} onChange={e => updateField("state", e.target.value)}>
                  {ALL_STATES.map(abbr => <option key={abbr} value={abbr}>{abbr}</option>)}
                </select>
              </div>
            </div>

            {showVehicleQuestions && (
              <div className="row">
                <div>
                  <label>Retired</label>
                  <HelpText field="retired" />
                  <select value={form.retired} onChange={e => updateField("retired", e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label>Owns a vehicle</label>
                  <HelpText field="ownsVehicle" />
                  <select value={form.ownsVehicle} onChange={e => updateField("ownsVehicle", e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
            )}

            <div className="row">
              <div>
                <label>County</label>
                <input value={form.county} onChange={e => updateField("county", e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label>School district</label>
                <input value={form.schoolDistrict} onChange={e => updateField("schoolDistrict", e.target.value)} placeholder="Optional" />
              </div>
            </div>

            <div className="actions">
              <button onClick={() => setPage(2)}>Next</button>
              <button className="secondary" onClick={saveProfile}>Save profile</button>
            </div>
          </div>
        )}

        {page === 2 && (
          <div className="card">
            <h2>Eligibility Details</h2>
            <ConfidenceMeter value={fill} />

            <div className="row">
              <div>
                <label>Household size</label>
                <input type="number" value={form.householdSize} onChange={e => updateField("householdSize", e.target.value)} />
              </div>
              <div>
                <label>Housing</label>
                <select value={form.housing} onChange={e => updateField("housing", e.target.value)}>
                  <option value="rent">Rent</option>
                  <option value="own">Own</option>
                  <option value="live_with_family">Live with family</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div><label>Primary residence</label><select value={form.primaryResidence} onChange={e => updateField("primaryResidence", e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
              <div><label>Utilities separate</label><select value={form.utilitiesSeparate} onChange={e => updateField("utilitiesSeparate", e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
            </div>

            {showCareQuestions && (
              <>
                <div className="row">
                  <div>
                    <label>Needs help with daily living</label>
                    <HelpText field="needsHelpDailyLiving" />
                    <select value={form.needsHelpDailyLiving} onChange={e => updateField("needsHelpDailyLiving", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select>
                  </div>
                  <div>
                    <label>Needs supervision</label>
                    <HelpText field="needsSupervision" />
                    <select value={form.needsSupervision} onChange={e => updateField("needsSupervision", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select>
                  </div>
                </div>

                <div className="row">
                  <div>
                    <label>Cannot live alone</label>
                    <HelpText field="cannotLiveAlone" />
                    <select value={form.cannotLiveAlone} onChange={e => updateField("cannotLiveAlone", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select>
                  </div>
                  <div>
                    <label>Nursing facility level of care</label>
                    <HelpText field="nursingFacilityLevelCare" />
                    <select value={form.nursingFacilityLevelCare} onChange={e => updateField("nursingFacilityLevelCare", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select>
                  </div>
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
              <div>
                <HelpText field="checkingBalance" />
                <input type="number" value={form.checkingBalance} onChange={e => updateField("checkingBalance", e.target.value)} placeholder="Checking" />
              </div>
              <div>
                <HelpText field="savingsBalance" />
                <input type="number" value={form.savingsBalance} onChange={e => updateField("savingsBalance", e.target.value)} placeholder="Savings" />
              </div>
              <div>
                <input type="number" value={form.otherAssets} onChange={e => updateField("otherAssets", e.target.value)} placeholder="Other assets" />
              </div>
            </div>

            <div className="row">
              <div><label>Monthly rent / mortgage</label><input type="number" value={form.monthlyRentMortgage} onChange={e => updateField("monthlyRentMortgage", e.target.value)} /></div>
              {showPropertyQuestions && <div><label>Property taxes paid yearly</label><input type="number" value={form.propertyTaxesPaid} onChange={e => updateField("propertyTaxesPaid", e.target.value)} /></div>}
            </div>

            {showMedicareQuestions && (
              <>
                <div className="row">
                  <div>
                    <label>Medicare A</label>
                    <HelpText field="medicareA" />
                    <select value={form.medicareA} onChange={e => updateField("medicareA", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select>
                  </div>
                  <div>
                    <label>Medicare B</label>
                    <HelpText field="medicareB" />
                    <select value={form.medicareB} onChange={e => updateField("medicareB", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select>
                  </div>
                </div>

                <div className="row">
                  <div>
                    <label>Medicare D</label>
                    <HelpText field="medicareD" />
                    <select value={form.medicareD} onChange={e => updateField("medicareD", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select>
                  </div>
                  <div>
                    <label>Medicaid active</label>
                    <HelpText field="medicaid" />
                    <select value={form.medicaid} onChange={e => updateField("medicaid", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select>
                  </div>
                </div>

                <div className="row">
                  <div>
                    <label>Prescription costs per month</label>
                    <HelpText field="prescriptionCosts" />
                    <input type="number" value={form.prescriptionCosts} onChange={e => updateField("prescriptionCosts", e.target.value)} />
                  </div>
                  <div><label>Long-term care / home care need</label><select value={form.longTermCare} onChange={e => updateField("longTermCare", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
                </div>
              </>
            )}

            <div className="summary">
              <div><strong>Total monthly income:</strong> {currency(monthlyIncome)}</div>
              <div><strong>Total assets:</strong> {currency(assets)}</div>
              <div><strong>Info entered:</strong> {fill}%</div>
            </div>

            <div className="actions">
              <button className="secondary" onClick={() => setPage(1)}>Back</button>
              <button onClick={calculate}>Find benefits</button>
              <button className="secondary" onClick={saveProfile}>Save profile</button>
            </div>
          </div>
        )}

        {page === 3 && (
          <div className="card">
            <h2>Results</h2>
            <ConfidenceMeter value={fill} />
            {prompts.length > 0 && (
              <div className="flags">
                <strong>Missing information that would improve accuracy</strong>
                {prompts.map((p, i) => <div key={i} className="flagItem">• {p}</div>)}
              </div>
            )}
            {flags.length > 0 && (
              <div className="flags">
                <strong>Auto flags</strong>
                {flags.map((flag, i) => <div key={i} className="flagItem">• {flag}</div>)}
              </div>
            )}

            <div className="actions">
              <button className="secondary" onClick={() => setPage(1)}>Edit info</button>
              <button className="secondary" onClick={() => window.print()}>Print</button>
            </div>

            {results.length === 0 ? <div className="empty">Enter information and tap Find benefits.</div> : results.map((item, i) => (
              <div key={i} className="result">
                <div className="resultTop">
                  <h3>{item.name}</h3>
                  <span className={`badge ${item.label.toLowerCase().replace(/\s+/g, "-")}`}>{item.label}</span>
                </div>
                <div className="muted">{item.type} · {item.category}</div>
                <p>{item.description}</p>
                <p><strong>Match score:</strong> {item.score}/100</p>
                <p><strong>What to gather:</strong> {item.docs}</p>
                <a href={item.link} target="_blank" rel="noreferrer">Open official site</a>
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
      </div>
    </div>
  );
}
