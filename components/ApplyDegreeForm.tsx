"use client";

import { useState } from "react";
import { submitApplication } from "@/lib/actions/applications";
import { Declaration } from "@/components/Declaration";
import { DEGREE_PROGRAM_LEVELS, formatFee, feeForLevel } from "@/lib/fees";
import type { ProgramLevel } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold [color-scheme:dark]";
const labelClass = "block text-sm font-medium text-slate-300";
const sectionClass = "rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-ink";

const ADVERTISING_OPTIONS = [
  "Newspaper advert",
  "Radio advert",
  "Flyer or leaflet",
  "Outdoor advertising (banner or poster)",
  "Online advert or social media",
  "None",
];

type Region = "usa" | "international";

function FeesBlock({ level, region }: { level: ProgramLevel | null; region: Region }) {
  if (!level) {
    return (
      <div className="rounded-lg border border-gold/30 bg-ink p-4 text-sm text-slate-200">
        <p className="text-center text-slate-400">Select a program above to see the tuition fee.</p>
      </div>
    );
  }
  const fee = feeForLevel(level, region);
  return (
    <div className="rounded-lg border border-gold/30 bg-ink p-4 text-sm text-slate-200">
      <p className="text-center text-slate-300">
        Tuition fee for this program: <span className="font-semibold text-gold">{formatFee(fee, region)}</span>
      </p>
      {region === "international" && (
        <div className="mt-4 border-t border-gold/20 pt-3 text-center">
          <p className="font-semibold text-gold">Payments can be made via M-Pesa to</p>
          <p className="mt-1">Account Name: Revealed Bible Training College Ltd</p>
          <p>Paybill: 542542</p>
          <p>Account Number: 03009422856350</p>
        </div>
      )}
    </div>
  );
}

export function ApplyDegreeForm({ presetRegion }: { presetRegion: Region | null }) {
  const [region, setRegion] = useState<Region>(presetRegion ?? "international");
  const [program, setProgram] = useState("");
  const level = program ? (DEGREE_PROGRAM_LEVELS[program] ?? "bachelors") : null;

  return (
    <form action={submitApplication} encType="multipart/form-data" className="group mt-6 space-y-4">
      <input type="hidden" name="source" value="tbcs" />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {presetRegion ? (
        <input type="hidden" name="region" value={presetRegion} />
      ) : (
        <div>
          <p className={labelClass}>Which campus / region are you applying from? *</p>
          <div className="mt-2 flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-200 has-checked:border-gold has-checked:text-gold">
              <input
                type="radio"
                name="region"
                value="usa"
                required
                checked={region === "usa"}
                onChange={() => setRegion("usa")}
                className="sr-only"
              />
              USA Campus
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-200 has-checked:border-gold has-checked:text-gold">
              <input
                type="radio"
                name="region"
                value="international"
                required
                checked={region === "international"}
                onChange={() => setRegion("international")}
                className="sr-only"
              />
              Kenya / Other (International)
            </label>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="program" className={labelClass}>Program *</label>
        <select
          id="program"
          name="program"
          required
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>Select a program</option>
          <optgroup label="Bachelor's Programs">
            <option value="Bachelor of Theology (B.Th.)">Bachelor of Theology (B.Th.)</option>
            <option value="Bachelor of Divinity (B.Div.)">Bachelor of Divinity (B.Div.)</option>
            <option value="Bachelor of Religious Education (B.R.E.)">Bachelor of Religious Education (B.R.E.)</option>
          </optgroup>
          <optgroup label="Master's Programs">
            <option value="Master of Theology (M.Th.)">Master of Theology (M.Th.)</option>
            <option value="Master of Divinity (M.Div.)">Master of Divinity (M.Div.)</option>
            <option value="Master of Arts in Christian Ministry">Master of Arts in Christian Ministry</option>
          </optgroup>
          <optgroup label="Doctorate Programs">
            <option value="Doctor of Theology (Th.D.)">Doctor of Theology (Th.D.)</option>
            <option value="Doctor of Divinity (D.Div.)">Doctor of Divinity (D.Div.)</option>
            <option value="Doctor of Ministry (D.Min.)">Doctor of Ministry (D.Min.)</option>
          </optgroup>
        </select>
      </div>


      <h2 className={sectionClass}>Personal Information</h2>
      <p className="text-xs text-slate-400">Please take care that the exams you put on your legal name.</p>

      <div>
        <label htmlFor="date_of_birth" className={labelClass}>Date of Birth *</label>
        <input id="date_of_birth" name="date_of_birth" type="date" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="title" className={labelClass}>Title *</label>
        <select id="title" name="title" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Mr">Mr</option>
          <option value="Mrs">Mrs</option>
          <option value="Miss">Miss</option>
          <option value="Ms">Ms</option>
        </select>
      </div>
      <div>
        <label htmlFor="sex" className={labelClass}>Sex *</label>
        <select id="sex" name="sex" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
      <div>
        <label htmlFor="age" className={labelClass}>Age *</label>
        <input id="age" name="age" type="number" min="0" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="surname" className={labelClass}>Surname / Family Name *</label>
        <input id="surname" name="surname" type="text" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="previous_surname" className={labelClass}>Previous Surname / Family Name</label>
        <input id="previous_surname" name="previous_surname" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="first_name" className={labelClass}>First Name / Given Name *</label>
        <input id="first_name" name="first_name" type="text" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="middle_name" className={labelClass}>Middle Name</label>
        <input id="middle_name" name="middle_name" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="passport_photo" className={labelClass}>Passport-size photo * (max 5MB)</label>
        <input id="passport_photo" name="passport_photo" type="file" accept="image/*" required className={inputClass} />
        <p className="mt-1 text-xs text-slate-500">You can upload an existing photo from your device, or take a new one.</p>
      </div>
      <div>
        <label htmlFor="home_address" className={labelClass}>Home Address *</label>
        <input id="home_address" name="home_address" type="text" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="home_zip" className={labelClass}>Zip code</label>
        <input id="home_zip" name="home_zip" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="telephone_home" className={labelClass}>Telephone (Home)</label>
        <input id="telephone_home" name="telephone_home" type="tel" className={inputClass} />
      </div>
      <div>
        <label htmlFor="mobile_number" className={labelClass}>Mobile Number *</label>
        <input id="mobile_number" name="mobile_number" type="tel" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="email_personal" className={labelClass}>Email (Personal) *</label>
        <input id="email_personal" name="email_personal" type="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="term_time_address" className={labelClass}>Term Time Address (if different from above)</label>
        <input id="term_time_address" name="term_time_address" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="term_time_zip" className={labelClass}>Zip code (Term Time Address)</label>
        <input id="term_time_zip" name="term_time_zip" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="emergency_contact_name" className={labelClass}>Emergency Contact — Name *</label>
        <input id="emergency_contact_name" name="emergency_contact_name" type="text" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="emergency_contact_relationship" className={labelClass}>Emergency Contact — Relationship</label>
        <input id="emergency_contact_relationship" name="emergency_contact_relationship" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="emergency_contact_email" className={labelClass}>Emergency Contact — Email</label>
        <input id="emergency_contact_email" name="emergency_contact_email" type="email" className={inputClass} />
      </div>
      <div>
        <label htmlFor="emergency_contact_telephone" className={labelClass}>Emergency Contact — Telephone (Home)</label>
        <input id="emergency_contact_telephone" name="emergency_contact_telephone" type="tel" className={inputClass} />
      </div>

      <h2 className={sectionClass}>Education References</h2>
      <p className="text-xs text-slate-400">Please note that we may contact your previous school/college for information.</p>

      <div>
        <label htmlFor="currently_studying_elsewhere" className={labelClass}>
          Are you currently a full or part-time student in another school? *
        </label>
        <select id="currently_studying_elsewhere" name="currently_studying_elsewhere" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div>
        <label htmlFor="school_college_name" className={labelClass}>School/College Name</label>
        <input id="school_college_name" name="school_college_name" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="school_address" className={labelClass}>Address</label>
        <input id="school_address" name="school_address" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="school_zip" className={labelClass}>Zip code</label>
        <input id="school_zip" name="school_zip" type="text" className={inputClass} />
      </div>

      <h2 className={sectionClass}>References</h2>
      <p className="text-xs text-slate-400">If sponsored by your church or ministry to do this course, please provide the details of the leader.</p>

      <div>
        <label htmlFor="church_ministry_name" className={labelClass}>Church / Ministry Name</label>
        <input id="church_ministry_name" name="church_ministry_name" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="church_ministry_address" className={labelClass}>Address</label>
        <input id="church_ministry_address" name="church_ministry_address" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="church_ministry_zip" className={labelClass}>Zip code</label>
        <input id="church_ministry_zip" name="church_ministry_zip" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="church_ministry_contact_name" className={labelClass}>Contact Name *</label>
        <input id="church_ministry_contact_name" name="church_ministry_contact_name" type="text" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="church_ministry_telephone" className={labelClass}>Telephone *</label>
        <input id="church_ministry_telephone" name="church_ministry_telephone" type="tel" required className={inputClass} />
      </div>

      <h2 className={sectionClass}>Further Information</h2>

      <div>
        <label htmlFor="how_did_you_hear" className={labelClass}>How did you hear about Tabernacle Bible College and Seminary? *</label>
        <select id="how_did_you_hear" name="how_did_you_hear" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Church or pastor recommendation">Church or pastor recommendation</option>
          <option value="Friend or family member">Friend or family member</option>
          <option value="Social media">Social media</option>
          <option value="Online search">Online search</option>
          <option value="College website">College website</option>
          <option value="Past or current student">Past or current student</option>
          <option value="Conference, crusade, or event">Conference, crusade, or event</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <p className={labelClass}>Have you seen or heard of any of the following promoting the college? *</p>
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {ADVERTISING_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-start gap-2 text-sm text-slate-300">
              <input type="checkbox" name="advertising_sources" value={opt} className="mt-1 h-4 w-4 rounded border-slate-600 bg-ink text-gold focus:ring-gold" />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="has_sponsor" className={labelClass}>If you have a sponsor, do they consent to you taking this course? *</label>
        <select id="has_sponsor" name="has_sponsor" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="I am self-funded">I am self-funded</option>
        </select>
      </div>
      <div>
        <label htmlFor="spouse_consent" className={labelClass}>If you have a spouse (not sponsor), do they consent to you taking this course? *</label>
        <select id="spouse_consent" name="spouse_consent" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="I am not married">I am not married</option>
        </select>
      </div>
      <div>
        <label htmlFor="is_christian" className={labelClass}>Are you a Christian? *</label>
        <select id="is_christian" name="is_christian" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div>
        <label htmlFor="baptized_water" className={labelClass}>Are you baptized by water? *</label>
        <select id="baptized_water" name="baptized_water" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div>
        <label htmlFor="baptized_holy_spirit" className={labelClass}>Are you baptized in the Holy Spirit? *</label>
        <select id="baptized_holy_spirit" name="baptized_holy_spirit" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div>
        <label htmlFor="church_name" className={labelClass}>Please provide details of church and ministries — Church Name *</label>
        <input id="church_name" name="church_name" type="text" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="church_address" className={labelClass}>Church address *</label>
        <input id="church_address" name="church_address" type="text" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="minister_pastor_name" className={labelClass}>Minister/Pastor&apos;s Name</label>
        <input id="minister_pastor_name" name="minister_pastor_name" type="text" className={inputClass} />
      </div>
      <div>
        <label htmlFor="how_long_attended_church" className={labelClass}>How long have you attended the church? *</label>
        <input id="how_long_attended_church" name="how_long_attended_church" type="text" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="called_to_ministry" className={labelClass}>Do you believe you have been called to ministry? *</label>
        <select id="called_to_ministry" name="called_to_ministry" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div>
        <label htmlFor="ministry_details" className={labelClass}>If already in ministry, give details</label>
        <textarea id="ministry_details" name="ministry_details" rows={3} className={inputClass} />
      </div>

      <h2 className={sectionClass}>Criminal Conviction</h2>
      <p className="text-xs text-slate-400">This is to be filled by all students.</p>
      <div className="rounded-lg border border-slate-700 bg-ink p-3 text-sm text-slate-300">
        The college recognizes it has a duty of care to staff and students and reserves the
        right not to enrol a person where there is evidence that they could be a threat or
        danger to others. Declaring a conviction will not necessarily prevent you from being
        offered a place, but failure to disclose something which we later become aware of
        could result in disciplinary action or your enrolment being cancelled. You must
        disclose all unspent convictions of any offence.
      </div>
      <div>
        <label htmlFor="criminal_conviction_details" className={labelClass}>
          Details of any unspent convictions (write &quot;None&quot; if not applicable) *
        </label>
        <textarea id="criminal_conviction_details" name="criminal_conviction_details" rows={2} required className={inputClass} />
      </div>

      <h2 className={sectionClass}>Study Plan</h2>

      <div>
        <label htmlFor="start_date" className={labelClass}>I want to start this year *</label>
        <input id="start_date" name="start_date" type="date" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="study_mode" className={labelClass}>I want to study *</label>
        <select id="study_mode" name="study_mode" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select</option>
          <option value="Part Time">Part Time</option>
          <option value="Full Time">Full Time</option>
        </select>
      </div>

      <h2 className={sectionClass}>Life Experience</h2>
      <div>
        <label htmlFor="statement" className={labelClass}>Tell us about your life experience and your call to ministry</label>
        <textarea id="statement" name="statement" rows={4} className={inputClass} />
      </div>

      <h2 className={sectionClass}>Fees</h2>
      <FeesBlock level={level} region={region} />

      <h2 className={sectionClass}>Declaration</h2>
      <div className="rounded-lg border border-slate-700 bg-ink p-3 text-sm text-slate-300">
        I confirm all the information provided on this form is correct. I will update the
        College if any of my personal details (e.g. address) change. I understand that any
        information I provide may be passed onto members of staff for the purposes of
        supporting me on my programme of study. The College reserves the right to change or
        cancel the courses. Please refer to the terms and conditions in the College
        prospectus.
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-200">
        <input type="checkbox" name="confirm_info_correct" value="Yes I confirm" required className="mt-1 h-4 w-4 rounded border-slate-600 bg-ink text-gold focus:ring-gold" />
        <span>Yes, I confirm</span>
      </label>

      <h2 className={sectionClass}>Financial Declaration</h2>
      <div>
        <label htmlFor="financial_declaration_given_names" className={labelClass}>Given Name(s) *</label>
        <input id="financial_declaration_given_names" name="financial_declaration_given_names" type="text" required className={inputClass} />
      </div>
      <Declaration />

      <button
        type="submit"
        className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
      >
        Submit Application
      </button>
    </form>
  );
}
