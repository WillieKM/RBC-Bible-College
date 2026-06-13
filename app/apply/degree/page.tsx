import { submitApplication } from "@/lib/actions/applications";
import { Declaration } from "@/components/Declaration";
import Link from "next/link";
import Image from "next/image";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold";
const labelClass = "block text-sm font-medium text-slate-300";
const sectionClass = "rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-ink";

const SUPPORT_OPTIONS = [
  "Visual impairment",
  "Hearing impairment",
  "Disability affecting mobility",
  "Profound complex disabilities",
  "Social and emotional difficulty",
  "Mental health difficulty",
  "Moderate learning difficulty",
  "Severe learning difficulty",
  "Dyslexia",
  "Dyscalculia",
  "Autism spectrum disorder",
  "Asperger's syndrome",
  "Temporary disability after illness or accident",
  "Other physical disability",
  "Other specific learning difficulty",
  "Other medical condition",
  "Other disability",
  "Prefer not to say",
];

const ADVERTISING_OPTIONS = [
  "Newspaper advert",
  "Radio advert",
  "Flyer or leaflet",
  "Outdoor advertising (banner or poster)",
  "Online advert or social media",
  "None",
];

export default async function ApplyDegreePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/tbcs-logo.png"
            alt="Tabernacle Bible College and Seminary"
            width={320}
            height={106}
            className="h-auto w-full max-w-[280px] rounded-lg"
          />
          <h1 className="mt-4 text-2xl font-bold text-gold">Bachelor&apos;s, Master&apos;s &amp; Doctorate Application Form</h1>
          <p className="mt-1 text-sm text-slate-400">
            Offered in partnership with Tabernacle Bible College and Seminary
          </p>
        </div>

        {success && (
          <div className="mt-4 rounded-lg bg-green-950 border border-green-800 px-3 py-2 text-sm text-green-300">
            Your application has been submitted! We&apos;ll be in touch by email, including
            information confirming the accreditation of this program.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {!success && (
          <form action={submitApplication} className="group mt-6 space-y-4">
            <input type="hidden" name="source" value="tbcs" />

            <div>
              <p className={labelClass}>Which campus / region are you applying from? *</p>
              <div className="mt-2 flex gap-3">
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-200 has-checked:border-gold has-checked:text-gold">
                  <input type="radio" name="region" value="usa" required className="sr-only" />
                  USA Campus
                </label>
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-200 has-checked:border-gold has-checked:text-gold">
                  <input type="radio" name="region" value="international" required defaultChecked className="sr-only" />
                  Kenya / Other (International)
                </label>
              </div>
            </div>

            <h2 className={sectionClass}>Personal Information</h2>
            <p className="text-xs text-slate-400">Please take care that the exams you put on your legal name.</p>

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
              <label htmlFor="date_of_birth" className={labelClass}>Date of Birth *</label>
              <input id="date_of_birth" name="date_of_birth" type="date" required className={inputClass} />
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
              <label htmlFor="home_address" className={labelClass}>Home Address *</label>
              <input id="home_address" name="home_address" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="home_postcode" className={labelClass}>Postcode</label>
              <input id="home_postcode" name="home_postcode" type="text" className={inputClass} />
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
              <label htmlFor="term_time_postcode" className={labelClass}>Postcode (Term Time Address)</label>
              <input id="term_time_postcode" name="term_time_postcode" type="text" className={inputClass} />
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

            <h2 className={sectionClass}>Section C: Residency</h2>

            <div>
              <label htmlFor="country_of_birth" className={labelClass}>What is your country of birth *</label>
              <input id="country_of_birth" name="country_of_birth" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="nationality" className={labelClass}>What is your nationality *</label>
              <input id="nationality" name="nationality" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="countries_lived_3_years" className={labelClass}>
                Which country(s) have you been living in for the past three years from your first day of the course *
              </label>
              <input id="countries_lived_3_years" name="countries_lived_3_years" type="text" required className={inputClass} />
            </div>

            <h2 className={sectionClass}>Support Services</h2>
            <p className="text-xs text-slate-400">
              The information you provide here will be used to identify any extra support you may require.
            </p>

            <div>
              <label htmlFor="has_disability" className={labelClass}>Do you have a disability or learning difficulty? *</label>
              <select id="has_disability" name="has_disability" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="has_medical_condition" className={labelClass}>
                Do you have a medical condition or health difficulty that may affect your attendance or participation? *
              </label>
              <select id="has_medical_condition" name="has_medical_condition" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <p className={labelClass}>If you answered yes to any of the questions above, please tick all that apply</p>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {SUPPORT_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-start gap-2 text-sm text-slate-300">
                    <input type="checkbox" name="support_details" value={opt} className="mt-1 h-4 w-4 rounded border-slate-600 bg-ink text-gold focus:ring-gold" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
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
              <label htmlFor="church_ministry_postcode" className={labelClass}>Postcode</label>
              <input id="church_ministry_postcode" name="church_ministry_postcode" type="text" className={inputClass} />
            </div>
            <div>
              <label htmlFor="church_ministry_contact_name" className={labelClass}>Contact Name *</label>
              <input id="church_ministry_contact_name" name="church_ministry_contact_name" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="church_ministry_telephone" className={labelClass}>Telephone *</label>
              <input id="church_ministry_telephone" name="church_ministry_telephone" type="tel" required className={inputClass} />
            </div>

            <h2 className={sectionClass}>Work Experience</h2>
            <p className="text-xs text-slate-400">Please provide relevant job experience.</p>

            <div>
              <label htmlFor="employment_status" className={labelClass}>What is your employment status? *</label>
              <select id="employment_status" name="employment_status" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Employed">Employed</option>
                <option value="Self employed">Self employed</option>
                <option value="Unemployed">Unemployed</option>
              </select>
            </div>
            <div>
              <label htmlFor="hours_employed" className={labelClass}>How many hours are you employed for? *</label>
              <select id="hours_employed" name="hours_employed" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Less than 16 hours per week">Less than 16 hours per week</option>
                <option value="16-19 hours per week">16-19 hours per week</option>
                <option value="20-29 hours per week">20-29 hours per week</option>
                <option value="30 hours or more per week">30 hours or more per week</option>
                <option value="Unemployed">Unemployed</option>
              </select>
            </div>
            <div>
              <label htmlFor="employment_start_date" className={labelClass}>How long have you been in your current place of employment? From... *</label>
              <input id="employment_start_date" name="employment_start_date" type="date" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="plans_category" className={labelClass}>Please select one of the categories below *</label>
              <select id="plans_category" name="plans_category" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Looking for work available to start immediately">Looking for work available to start immediately</option>
                <option value="Not looking for work and/or not available to start work (includes retirement)">Not looking for work and/or not available to start work (includes retirement)</option>
              </select>
            </div>
            <div>
              <label htmlFor="unemployed_duration" className={labelClass}>If unemployed, how long have you been unemployed? *</label>
              <select id="unemployed_duration" name="unemployed_duration" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Less than 6 months">Less than 6 months</option>
                <option value="6-11 months">6-11 months</option>
                <option value="12-23 months">12-23 months</option>
                <option value="24-35 months">24-35 months</option>
                <option value="36 months or over">36 months or over</option>
                <option value="Employed">Employed</option>
              </select>
            </div>
            <div>
              <label htmlFor="plans_after_school" className={labelClass}>What are your plans after school? *</label>
              <select id="plans_after_school" name="plans_after_school" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Further education course">Further education course</option>
                <option value="Higher education level">Higher education level</option>
                <option value="Apprenticeship">Apprenticeship</option>
                <option value="Paid employment">Paid employment</option>
                <option value="Continued existing employment">Continued existing employment</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>

            <h2 className={sectionClass}>Further Information</h2>

            <div>
              <label htmlFor="how_did_you_hear" className={labelClass}>How did you hear about Tabernacle Bible College and Seminary? *</label>
              <select id="how_did_you_hear" name="how_did_you_hear" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="I am family">I am family</option>
                <option value="I am a past student">I am a past student</option>
                <option value="Recommendation from family">Recommendation from family</option>
                <option value="Recommended by pastor">Recommended by pastor</option>
                <option value="Recommended from school/college tutor">Recommended from school/college tutor</option>
                <option value="College advertising">College advertising</option>
                <option value="College website">College website</option>
                <option value="Stand at the College">Stand at the College</option>
                <option value="College stand at vocational event">College stand at vocational event</option>
                <option value="College presentation at school">College presentation at school</option>
                <option value="Other ways">Other ways</option>
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

            <h2 className={sectionClass}>Program &amp; Study Plan</h2>

            <div>
              <label htmlFor="program" className={labelClass}>Program *</label>
              <select id="program" name="program" required defaultValue="" className={inputClass}>
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

            <h2 className={sectionClass}>Fees Structure</h2>

            <div className="hidden rounded-lg border border-gold/30 bg-ink p-4 text-sm text-slate-200 group-has-[input[name=region][value=international]:checked]:block">
              <p className="text-center text-xs uppercase tracking-widest text-slate-400">Kenya Campus</p>
              <p className="mt-2 text-center font-semibold text-gold">BACHELOR&apos;S COURSE — TUITION FEES</p>
              <div className="mt-3 flex justify-between"><span>Total cost including materials</span><span className="font-semibold">KSH 120,000</span></div>
              <div className="mt-1 flex justify-between"><span>Enrolment Fee (paid on submitting the application form)</span><span className="font-semibold">KSH 10,000</span></div>
              <p className="mt-4 font-semibold text-gold">Payment Plans Available</p>
              <div className="mt-1 flex justify-between"><span>Plan One — Pay in full</span><span className="font-semibold">KSH 120,000</span></div>
              <div className="mt-1 flex justify-between"><span>Plan Two — Pay in 2 instalments of</span><span className="font-semibold">KSH 60,000</span></div>
              <div className="mt-1 flex justify-between"><span>Plan Three — Pay in 4 instalments of</span><span className="font-semibold">KSH 30,000</span></div>

              <div className="mt-5 border-t border-gold/20 pt-4">
                <p className="text-center font-semibold text-gold">MASTER&apos;S COURSE — TUITION FEES</p>
                <div className="mt-3 flex justify-between"><span>Total cost including materials</span><span className="font-semibold">KSH 150,000</span></div>
                <div className="mt-1 flex justify-between"><span>Enrolment Fee (paid on submitting the application form)</span><span className="font-semibold">KSH 20,000</span></div>
                <p className="mt-4 font-semibold text-gold">Payment Plans Available</p>
                <div className="mt-1 flex justify-between"><span>Plan One — Pay in full</span><span className="font-semibold">KSH 150,000</span></div>
                <div className="mt-1 flex justify-between"><span>Plan Two — Pay in 2 instalments of</span><span className="font-semibold">KSH 75,000</span></div>
                <div className="mt-1 flex justify-between"><span>Plan Three — Pay in 4 instalments of</span><span className="font-semibold">KSH 37,500</span></div>
              </div>

              <p className="mt-5 font-semibold text-gold">Payments should be made through</p>
              <p className="mt-1">Lipa na M-Pesa</p>
              <p>Paybill # 247247</p>
              <p>A/C # 0729249697</p>
            </div>

            <div className="hidden rounded-lg border border-gold/30 bg-ink p-4 text-sm text-slate-200 group-has-[input[name=region][value=usa]:checked]:block">
              <p className="text-center text-xs uppercase tracking-widest text-slate-400">USA Campus</p>
              <p className="mt-2 text-center font-semibold text-gold">BACHELOR&apos;S COURSE — TUITION FEES</p>
              <div className="mt-3 flex justify-between"><span>Total cost including materials</span><span className="font-semibold">$2,000</span></div>
              <div className="mt-1 flex justify-between"><span>Enrolment Fee (paid on submitting the application form)</span><span className="font-semibold">$250</span></div>
              <p className="mt-4 font-semibold text-gold">Payment Plans Available</p>
              <div className="mt-1 flex justify-between"><span>Plan One — Pay in full</span><span className="font-semibold">$2,000</span></div>
              <div className="mt-1 flex justify-between"><span>Plan Two — Pay in 2 instalments of</span><span className="font-semibold">$1,000</span></div>
              <div className="mt-1 flex justify-between"><span>Plan Three — Pay in 4 instalments of</span><span className="font-semibold">$500</span></div>

              <div className="mt-5 border-t border-gold/20 pt-4">
                <p className="text-center font-semibold text-gold">MASTER&apos;S COURSE — TUITION FEES</p>
                <div className="mt-3 flex justify-between"><span>Total cost including materials</span><span className="font-semibold">$2,300</span></div>
                <div className="mt-1 flex justify-between"><span>Enrolment Fee (paid on submitting the application form)</span><span className="font-semibold">$300</span></div>
                <p className="mt-4 font-semibold text-gold">Payment Plans Available</p>
                <div className="mt-1 flex justify-between"><span>Plan One — Pay in full</span><span className="font-semibold">$2,300</span></div>
                <div className="mt-1 flex justify-between"><span>Plan Two — Pay in 2 instalments of</span><span className="font-semibold">$1,150</span></div>
                <div className="mt-1 flex justify-between"><span>Plan Three — Pay in 4 instalments of</span><span className="font-semibold">$575</span></div>
              </div>

              <p className="mt-5 font-semibold text-gold">Payments should be made through</p>
              <p className="mt-1">CashApp / Zelle</p>
              <p>+1 (206) 326-8094</p>
            </div>

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
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Applying from the United States?{" "}
          <Link href="/apply" className="text-gold hover:underline">
            Apply here
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-400">
          <Link href="/" className="text-gold hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
