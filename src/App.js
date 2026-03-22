
import React, { useMemo, useState, useEffect } from "react";

const STATES = {
  "AL": {
    "portal": "https://mydhr.alabama.gov/",
    "unclaimed": "https://alabama.findyourunclaimedproperty.com/"
  },
  "AK": {
    "portal": "https://health.alaska.gov/dpa/Pages/default.aspx",
    "unclaimed": "https://unclaimedproperty.alaska.gov/"
  },
  "AZ": {
    "portal": "https://des.az.gov/services/basic-needs",
    "unclaimed": "https://azdor.gov/unclaimed-property"
  },
  "AR": {
    "portal": "https://access.arkansas.gov/",
    "unclaimed": "https://auditor.ar.gov/unclaimed-property/"
  },
  "CA": {
    "portal": "https://benefitscal.com/",
    "unclaimed": "https://ucpi.sco.ca.gov/en/Property/SearchIndex"
  },
  "CO": {
    "portal": "https://peak--coloradopeak.force.com/",
    "unclaimed": "https://colorado.findyourunclaimedproperty.com/"
  },
  "CT": {
    "portal": "https://portal.ct.gov/dss",
    "unclaimed": "https://ctbiglist.com/"
  },
  "DE": {
    "portal": "https://assist.dhss.delaware.gov/",
    "unclaimed": "https://unclaimedproperty.delaware.gov/"
  },
  "FL": {
    "portal": "https://www.myflfamilies.com/services/public-assistance",
    "unclaimed": "https://www.fltreasurehunt.gov/"
  },
  "GA": {
    "portal": "https://gateway.ga.gov/",
    "unclaimed": "https://dor.georgia.gov/unclaimed-property-program"
  },
  "HI": {
    "portal": "https://pais-benefits.dhs.hawaii.gov/",
    "unclaimed": "https://unclaimedproperty.ehawaii.gov/"
  },
  "ID": {
    "portal": "https://healthandwelfare.idaho.gov/services-programs/food-assistance",
    "unclaimed": "https://yourmoney.idaho.gov/"
  },
  "IL": {
    "portal": "https://abe.illinois.gov/abe/access/",
    "unclaimed": "https://icash.illinoistreasurer.gov/"
  },
  "IN": {
    "portal": "https://fssabenefits.in.gov/",
    "unclaimed": "https://indianaunclaimed.gov/"
  },
  "IA": {
    "portal": "https://hhsservices.iowa.gov/apspssp/ssp.portal",
    "unclaimed": "https://greatiowatreasurehunt.gov/"
  },
  "KS": {
    "portal": "https://www.dcf.ks.gov/services/ees/Pages/Application-for-benefits.aspx",
    "unclaimed": "https://kansascash.ks.gov/"
  },
  "KY": {
    "portal": "https://kynect.ky.gov/",
    "unclaimed": "https://treasury.ky.gov/unclaimedproperty/Pages/default.aspx"
  },
  "LA": {
    "portal": "https://sspweb.ie.dcfs.la.gov/selfservice/",
    "unclaimed": "https://louisiana.findyourunclaimedproperty.com/"
  },
  "ME": {
    "portal": "https://www.maine.gov/dhhs/ofi/programs-services",
    "unclaimed": "https://apps.web.maine.gov/unclaimed/"
  },
  "MD": {
    "portal": "https://mymdthink.maryland.gov/home/#/",
    "unclaimed": "https://interactive.marylandtaxes.gov/Individuals/Unclaim/default.aspx"
  },
  "MA": {
    "portal": "https://dtaconnect.eohhs.mass.gov/",
    "unclaimed": "https://findmassmoney.mass.gov/"
  },
  "MI": {
    "portal": "https://newmibridges.michigan.gov/s/isd-landing-page",
    "unclaimed": "https://unclaimedproperty.michigan.gov/"
  },
  "MN": {
    "portal": "https://mnbenefits.mn.gov/",
    "unclaimed": "https://mn.gov/commerce/consumer/your-money/find-missing-money/"
  },
  "MS": {
    "portal": "https://my.mdhs.ms.gov/",
    "unclaimed": "https://treasury.ms.gov/for-citizens/unclaimed-property/"
  },
  "MO": {
    "portal": "https://mydss.mo.gov/",
    "unclaimed": "https://treasurer.mo.gov/unclaimedproperty/"
  },
  "MT": {
    "portal": "https://apply.mt.gov/",
    "unclaimed": "https://tap.dor.mt.gov/_/#1"
  },
  "NE": {
    "portal": "https://accessnebraska.ne.gov/",
    "unclaimed": "https://treasurer.nebraska.gov/up"
  },
  "NV": {
    "portal": "https://accessnevada.dwss.nv.gov/",
    "unclaimed": "https://claimit.nv.gov/"
  },
  "NH": {
    "portal": "https://nheasy.nh.gov/",
    "unclaimed": "https://www.yourmoney.nh.gov/"
  },
  "NJ": {
    "portal": "https://www.njhelps.gov/",
    "unclaimed": "https://unclaimedfunds.nj.gov/"
  },
  "NM": {
    "portal": "https://www.yes.state.nm.us/yesnm/home/index",
    "unclaimed": "https://nmclaims.unclaimedproperty.com/"
  },
  "NY": {
    "portal": "https://mybenefits.ny.gov/mybenefits/begin",
    "unclaimed": "https://ouf.osc.state.ny.us/ouf/"
  },
  "NC": {
    "portal": "https://epass.nc.gov/",
    "unclaimed": "https://www.nccash.com/"
  },
  "ND": {
    "portal": "https://www.nd.gov/dhs/services/financialhelp/foodstamps/",
    "unclaimed": "https://land.nd.gov/unclaimed-property"
  },
  "OH": {
    "portal": "https://benefits.ohio.gov/",
    "unclaimed": "https://com.ohio.gov/divisions-and-programs/unclaimed-funds"
  },
  "OK": {
    "portal": "https://okdhslive.org/",
    "unclaimed": "https://www.oktreasure.com/"
  },
  "OR": {
    "portal": "https://www.oregon.gov/odhs/benefits/Pages/default.aspx",
    "unclaimed": "https://unclaimed.oregon.gov/"
  },
  "PA": {
    "portal": "https://www.compass.state.pa.us/compass.web/Public/CMPHome",
    "unclaimed": "https://www.patreasury.gov/unclaimed-property/"
  },
  "RI": {
    "portal": "https://healthyrhode.ri.gov/",
    "unclaimed": "https://treasury.ri.gov/unclaimed-property"
  },
  "SC": {
    "portal": "https://benefitsportal.dss.sc.gov/",
    "unclaimed": "https://treasurer.sc.gov/what-we-do/for-citizens/unclaimed-property-program/"
  },
  "SD": {
    "portal": "https://dss.sd.gov/assistance/",
    "unclaimed": "https://southdakota.findyourunclaimedproperty.com/"
  },
  "TN": {
    "portal": "https://faonlineapp.dhs.tn.gov/",
    "unclaimed": "https://treasury.tn.gov/Unclaimed-Property"
  },
  "TX": {
    "portal": "https://www.yourtexasbenefits.com/",
    "unclaimed": "https://www.claimittexas.gov/"
  },
  "UT": {
    "portal": "https://jobs.utah.gov/mycase/",
    "unclaimed": "https://mycash.utah.gov/"
  },
  "VT": {
    "portal": "https://mybenefits.vermont.gov/",
    "unclaimed": "https://treasurer.vermont.gov/unclaimed-property"
  },
  "VA": {
    "portal": "https://commonhelp.virginia.gov/",
    "unclaimed": "https://www.vamoneysearch.gov/"
  },
  "WA": {
    "portal": "https://www.washingtonconnection.org/home/",
    "unclaimed": "https://ucp.dor.wa.gov/"
  },
  "WV": {
    "portal": "https://www.wvpath.wv.gov/",
    "unclaimed": "https://www.wvtreasury.com/Unclaimed-Property"
  },
  "WI": {
    "portal": "https://access.wisconsin.gov/",
    "unclaimed": "https://www.revenue.wi.gov/Pages/UnclaimedProperty/Home.aspx"
  },
  "WY": {
    "portal": "https://dfsweb.wyo.gov/economic-assistance-program/food-assistance",
    "unclaimed": "https://statetreasurer.wyo.gov/unclaimed-property/"
  }
};

const stateOptions = Object.keys(STATES).sort();

function money(value) {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function useSpeechInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognition;
  const listen = (onText) => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      onText(text);
    };
    rec.start();
  };
  return { supported, listen };
}

function numericFromSpeech(text) {
  return (text || "").replace(/[^0-9.]/g, "");
}

function getFederalPrograms(data) {
  const income = Number(data.monthlyIncome || 0);
  const household = Math.max(1, Number(data.householdSize || 1));
  const age = Number(data.age || 0);
  const medical = data.medical === "yes";
  const housing = data.housing;
  const items = [];

  if (income <= 1971) {
    items.push({
      title: "SSI",
      likelihood: "Very likely",
      type: "Federal",
      description: "Monthly cash assistance for older adults and people with disabilities who meet income and resource rules.",
      docs: "Photo ID, Social Security number, income proof, bank balance, housing costs.",
      link: "https://www.ssa.gov/ssi"
    });
  }

  const snapLimit = 2550 + (household - 1) * 900;
  if (income <= snapLimit) {
    items.push({
      title: "SNAP",
      likelihood: "Very likely",
      type: "Federal",
      description: "Monthly grocery help based on income and household size.",
      docs: "ID, income proof, rent or mortgage, utility bills, household members.",
      link: "https://www.fns.usda.gov/snap"
    });
  }

  items.push({
    title: "LIHEAP",
    likelihood: income <= 3000 ? "Likely" : "Possible",
    type: "Federal/State",
    description: "Help with heating and cooling bills.",
    docs: "Utility bill, ID, income proof, household list.",
    link: "https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap"
  });

  if (housing === "rent") {
    items.push({
      title: "Housing Choice Voucher / Section 8",
      likelihood: income <= 3000 ? "Likely" : "Possible",
      type: "Federal/Local",
      description: "Rent assistance through local housing authorities.",
      docs: "ID, income proof, rent amount, lease, household information.",
      link: "https://www.hud.gov/topics/housing_choice_voucher_program_section_8"
    });
  }

  if (age >= 65 || medical) {
    items.push({
      title: "Medicare Savings Programs",
      likelihood: income <= 2200 ? "Very likely" : "Possible",
      type: "Federal/State",
      description: "Help paying Medicare premiums and sometimes deductibles or copays.",
      docs: "Medicare card, ID, income proof, bank balances.",
      link: "https://www.medicare.gov/basics/costs/help/medicare-savings-programs"
    });
    items.push({
      title: "Extra Help for Prescriptions",
      likelihood: income <= 2500 ? "Very likely" : "Possible",
      type: "Federal",
      description: "Help paying Medicare Part D prescription costs.",
      docs: "Medicare information, prescription list, income and resource details.",
      link: "https://www.ssa.gov/extrahelp"
    });
  }

  items.push({
    title: "Federal Benefits Screening",
    likelihood: "Check",
    type: "Federal",
    description: "Official U.S. government benefits screener for additional programs.",
    docs: "Basic household, income, and age information.",
    link: "https://www.benefits.gov/benefit-finder"
  });

  return items;
}

function getStatePrograms(data) {
  const income = Number(data.monthlyIncome || 0) * 12;
  const age = Number(data.age || 0);
  const state = data.state;
  const info = STATES[state];
  const items = [];
  if (!info) return items;

  items.push({
    title: `${state} State Benefits Portal`,
    likelihood: "Check",
    type: "State",
    description: "Official state portal for food, medical, cash, utility, and other support programs.",
    docs: "ID, address, income proof, household size.",
    link: info.portal
  });

  items.push({
    title: `${state} Unclaimed Money`,
    likelihood: "Check",
    type: "State",
    description: "Search for unclaimed money, old refunds, dormant accounts, or property owed to you.",
    docs: "Your name and current or past address.",
    link: info.unclaimed
  });

  if (state === "PA") {
    if (age >= 65 && income <= 35000) {
      items.push({
        title: "PA Property Tax/Rent Rebate",
        likelihood: "Very likely",
        type: "Pennsylvania",
        description: "Annual rebate for eligible older adults and some people with disabilities.",
        docs: "Rent certificate or property tax proof, income documents, ID.",
        link: "https://www.revenue.pa.gov/IncentivesCreditsPrograms/PropertyTaxRentRebateProgram/Pages/default.aspx"
      });
    }

    if (age >= 65) {
      items.push({
        title: "PA Homestead / Farmstead Exclusion",
        likelihood: "Possible",
        type: "Pennsylvania",
        description: "Property tax relief that may reduce the assessed value used to calculate school property taxes on an eligible primary residence. This is different from the cash rebate program.",
        docs: "Proof the home is your primary residence, parcel or property information, homeowner information, county assessment application.",
        link: "https://dced.pa.gov/local-government/property-tax-relief-homestead-exclusion/"
      });
    }

    if (age >= 65 && income <= 33000) {
      items.push({
        title: "PACE / PACENET",
        likelihood: "Very likely",
        type: "Pennsylvania",
        description: "Prescription help for eligible Pennsylvania seniors.",
        docs: "Prescription list, Medicare card, income proof, ID.",
        link: "https://www.aging.pa.gov/aging-services/prescription-assistance/Pages/default.aspx"
      });
    }
  }

  if (state === "NY" && age >= 65) {
    items.push({
      title: "NY EPIC",
      likelihood: "Likely",
      type: "New York",
      description: "Prescription drug support program for older New Yorkers.",
      docs: "Medicare information, prescription list, income proof.",
      link: "https://www.health.ny.gov/health_care/epic/"
    });
  }

  if (state === "NJ" && age >= 65) {
    items.push({
      title: "NJ Property Tax Relief",
      likelihood: "Possible",
      type: "New Jersey",
      description: "Property tax relief options for eligible seniors.",
      docs: "Property tax records, ID, income proof.",
      link: "https://www.nj.gov/treasury/taxation/relief.shtml"
    });
  }

  if (state === "OH") {
    items.push({
      title: "Ohio Benefits",
      likelihood: "Check",
      type: "Ohio",
      description: "State entry point for SNAP, Medicaid, cash, and energy help.",
      docs: "ID, income proof, address, household information.",
      link: "https://benefits.ohio.gov/"
    });
  }

  return items;
}

function rankOrder(value) {
  return {
    "Very likely": 1,
    "Likely": 2,
    "Possible": 3,
    "Check": 4
  }[value] || 9;
}

function buildResults(data) {
  const combined = [...getFederalPrograms(data), ...getStatePrograms(data)];
  return combined.sort((a, b) => rankOrder(a.likelihood) - rankOrder(b.likelihood) || a.title.localeCompare(b.title));
}

const emptyProfile = {
  personName: "",
  age: "",
  monthlyIncome: "",
  householdSize: "1",
  housing: "rent",
  medical: "no",
  state: "PA"
};

export default function App() {
  const [form, setForm] = useState(emptyProfile);
  const [results, setResults] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [mode, setMode] = useState("single");
  const speech = useSpeechInput();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("senior-benefits-profiles") || "[]");
      if (Array.isArray(saved)) setProfiles(saved);
    } catch (e) {}
  }, []);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function calculate() {
    const next = buildResults(form);
    setResults(next);
    if (form.personName) {
      speakText(`Results ready for ${form.personName}. Found ${next.length} programs to review.`);
    } else {
      speakText(`Results ready. Found ${next.length} programs to review.`);
    }
  }

  function saveProfile() {
    const name = form.personName?.trim() || `Profile ${profiles.length + 1}`;
    const cleaned = { ...form, personName: name };
    const next = [...profiles.filter((p) => p.personName !== name), cleaned];
    setProfiles(next);
    localStorage.setItem("senior-benefits-profiles", JSON.stringify(next));
    speakText(`Saved profile for ${name}`);
  }

  function loadProfile(profile) {
    setForm(profile);
    setResults(buildResults(profile));
  }

  function removeProfile(name) {
    const next = profiles.filter((p) => p.personName !== name);
    setProfiles(next);
    localStorage.setItem("senior-benefits-profiles", JSON.stringify(next));
  }

  const summaryText = useMemo(() => {
    const veryLikely = results.filter((r) => r.likelihood === "Very likely").length;
    const likely = results.filter((r) => r.likelihood === "Likely").length;
    return `Very likely: ${veryLikely} · Likely: ${likely} · Total: ${results.length}`;
  }, [results]);

  return (
    <div className="app-shell">
      <div className="app-card">
        <div className="hero">
          <div>
            <h1>Senior Benefits Finder</h1>
            <p>Simple help for seniors and caregivers. Enter information once and review likely programs, state help, and unclaimed money.</p>
          </div>
          <button className="secondary" onClick={() => setMode(mode === "single" ? "caregiver" : "single")}>
            {mode === "single" ? "Caregiver Mode" : "Single Person Mode"}
          </button>
        </div>

        <div className="grid">
          <section className="panel">
            <h2>{mode === "single" ? "Person Information" : "Caregiver Intake"}</h2>

            <label>Name</label>
            <input value={form.personName} onChange={(e) => updateField("personName", e.target.value)} placeholder="Example: Mary Smith" />

            <div className="row">
              <div>
                <label>Age</label>
                <div className="inputWithButton">
                  <input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} placeholder="65" />
                  {speech.supported && <button type="button" className="mic" onClick={() => speech.listen((t) => updateField("age", numericFromSpeech(t)))}>Speak</button>}
                </div>
              </div>
              <div>
                <label>Monthly income</label>
                <div className="inputWithButton">
                  <input type="number" value={form.monthlyIncome} onChange={(e) => updateField("monthlyIncome", e.target.value)} placeholder="1800" />
                  {speech.supported && <button type="button" className="mic" onClick={() => speech.listen((t) => updateField("monthlyIncome", numericFromSpeech(t)))}>Speak</button>}
                </div>
              </div>
            </div>

            <div className="row">
              <div>
                <label>Household size</label>
                <input type="number" min="1" value={form.householdSize} onChange={(e) => updateField("householdSize", e.target.value)} />
              </div>
              <div>
                <label>Housing</label>
                <select value={form.housing} onChange={(e) => updateField("housing", e.target.value)}>
                  <option value="rent">Rent</option>
                  <option value="own">Own</option>
                  <option value="live_with_family">Live with family</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div>
                <label>Medical condition / disability</label>
                <select value={form.medical} onChange={(e) => updateField("medical", e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label>State</label>
                <select value={form.state} onChange={(e) => updateField("state", e.target.value)}>
                  {stateOptions.map((abbr) => <option key={abbr} value={abbr}>{abbr}</option>)}
                </select>
              </div>
            </div>

            <div className="buttonRow">
              <button onClick={calculate}>Find benefits</button>
              <button className="secondary" onClick={saveProfile}>Save profile</button>
              <button className="secondary" onClick={() => window.print()}>Print</button>
            </div>

            <div className="helpBox">
              <strong>Voice help:</strong> Tap <em>Speak</em> for age or income. Voice input works best in Chrome on Android and secure websites.
            </div>
          </section>

          <section className="panel">
            <h2>Results</h2>
            <div className="summaryBar">{summaryText}</div>
            {results.length === 0 ? (
              <div className="empty">Enter information and tap <strong>Find benefits</strong>.</div>
            ) : (
              results.map((item, idx) => (
                <div key={idx} className="resultCard">
                  <div className="resultTop">
                    <h3>{item.title}</h3>
                    <span className={`badge badge-${item.likelihood.replace(/\s+/g, "-").toLowerCase()}`}>{item.likelihood}</span>
                  </div>
                  <div className="muted">{item.type}</div>
                  <p>{item.description}</p>
                  <p><strong>What to gather:</strong> {item.docs}</p>
                  <a href={item.link} target="_blank" rel="noreferrer">Open official site</a>
                </div>
              ))
            )}
          </section>
        </div>

        <section className="panel profiles">
          <h2>Saved profiles</h2>
          {profiles.length === 0 ? (
            <div className="empty">No saved profiles yet.</div>
          ) : (
            profiles.map((p) => (
              <div key={p.personName} className="profileRow">
                <div>
                  <strong>{p.personName}</strong>
                  <div className="muted">{p.state} · Age {p.age || "—"} · Income {p.monthlyIncome ? money(p.monthlyIncome) : "—"}</div>
                </div>
                <div className="profileButtons">
                  <button className="secondary" onClick={() => loadProfile(p)}>Load</button>
                  <button className="danger" onClick={() => removeProfile(p.personName)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
