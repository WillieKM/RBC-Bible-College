import { submitApplication } from "@/lib/actions/applications";
import { Declaration } from "@/components/Declaration";
import Link from "next/link";
import Image from "next/image";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold";
const labelClass = "block text-sm font-medium text-slate-300";

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="Revelation Bible College International" width={72} height={72} className="rounded-full" />
          <h1 className="mt-4 text-xl font-bold text-gold">Revelation Bible College International</h1>
          <p className="mt-1 text-sm text-slate-400">(RBCI-USA) Application Form</p>
        </div>

        {success && (
          <div className="mt-4 rounded-lg bg-green-950 border border-green-800 px-3 py-2 text-sm text-green-300">
            Your application has been submitted! We&apos;ll be in touch by email.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {!success && (
          <form action={submitApplication} className="group mt-6 space-y-4">
            <input type="hidden" name="source" value="rbc" />

            <div>
              <p className={labelClass}>Which campus / region are you applying from? *</p>
              <div className="mt-2 flex gap-3">
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-200 has-checked:border-gold has-checked:text-gold">
                  <input type="radio" name="region" value="usa" required defaultChecked className="sr-only" />
                  USA Campus
                </label>
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-200 has-checked:border-gold has-checked:text-gold">
                  <input type="radio" name="region" value="international" required className="sr-only" />
                  Kenya / Other (International)
                </label>
              </div>
            </div>

            <h2 className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-ink">Personal Information</h2>

            <div>
              <label htmlFor="full_name" className={labelClass}>What is your name *</label>
              <input id="full_name" name="full_name" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Contact Information — Telephone number *</label>
              <input id="phone" name="phone" type="tel" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email Address *</label>
              <input id="email" name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="date_of_birth" className={labelClass}>Date of birth *</label>
              <input id="date_of_birth" name="date_of_birth" type="date" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="gender" className={labelClass}>Gender *</label>
              <select id="gender" name="gender" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label htmlFor="nationality" className={labelClass}>Nationality *</label>
              <input id="nationality" name="nationality" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="city_of_residence" className={labelClass}>What is your city of Residence *</label>
              <input id="city_of_residence" name="city_of_residence" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="occupation" className={labelClass}>Occupation</label>
              <input id="occupation" name="occupation" type="text" className={inputClass} />
            </div>

            <h2 className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-ink">Marital Status</h2>

            <div>
              <label htmlFor="is_married" className={labelClass}>Are you married? *</label>
              <select id="is_married" name="is_married" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="marriage_length" className={labelClass}>If yes, how long have you been in marriage?</label>
              <input id="marriage_length" name="marriage_length" type="text" className={inputClass} />
            </div>
            <div>
              <label htmlFor="spouse_agrees" className={labelClass}>Does your spouse agree with your decision?</label>
              <select id="spouse_agrees" name="spouse_agrees" defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="spouse_phone" className={labelClass}>Spouse Telephone number (if any)</label>
              <input id="spouse_phone" name="spouse_phone" type="tel" className={inputClass} />
            </div>

            <h2 className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-ink">Education</h2>

            <div>
              <label htmlFor="highest_education" className={labelClass}>Highest level of education you have attained *</label>
              <select id="highest_education" name="highest_education" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="PHD">PHD</option>
                <option value="Masters">Masters</option>
                <option value="Degree">Degree</option>
                <option value="Diploma">Diploma</option>
                <option value="Certificate">Certificate</option>
                <option value="Basic Education">Basic Education</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
              <label htmlFor="program" className={labelClass}>What level are you applying for in Revelation Bible College? *</label>
              <select id="program" name="program" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select</option>
                <option value="Certificate">Certificate</option>
                <option value="Diploma">Diploma</option>
              </select>
            </div>
            <div>
              <label htmlFor="statement" className={labelClass}>Personal statement</label>
              <textarea id="statement" name="statement" rows={4} className={inputClass} />
            </div>

            <h2 className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-ink">Fees Structure</h2>

            <div className="hidden rounded-lg border border-gold/30 bg-ink p-4 text-sm text-slate-200 group-has-[input[name=region][value=international]:checked]:block">
              <p className="text-center text-xs uppercase tracking-widest text-slate-400">Kenya Campus</p>
              <p className="mt-2 text-center font-semibold text-gold">DIPLOMA COURSE — TUITION FEES</p>
              <div className="mt-3 flex justify-between"><span>Total cost including materials</span><span className="font-semibold">KSH 60,000</span></div>
              <div className="mt-1 flex justify-between"><span>Enrolment Fee (paid on submitting the application form)</span><span className="font-semibold">KSH 1,000</span></div>
              <p className="mt-4 font-semibold text-gold">Payment Plans Available</p>
              <div className="mt-1 flex justify-between"><span>Plan One — Pay in full</span><span className="font-semibold">KSH 60,000</span></div>
              <div className="mt-1 flex justify-between"><span>Plan Two — Pay in 2 instalments of</span><span className="font-semibold">KSH 30,000</span></div>
              <div className="mt-1 flex justify-between"><span>Plan Three — Pay in 4 instalments of</span><span className="font-semibold">KSH 15,000</span></div>
              <p className="mt-5 font-semibold text-gold">Payments should be made through</p>
              <p className="mt-1">Lipa na M-Pesa</p>
              <p>Paybill # 247247</p>
              <p>A/C # 0729249697</p>
            </div>

            <div className="hidden rounded-lg border border-gold/30 bg-ink p-4 text-sm text-slate-200 group-has-[input[name=region][value=usa]:checked]:block">
              <p className="text-center text-xs uppercase tracking-widest text-slate-400">USA Campus</p>
              <p className="mt-3 text-center text-slate-300">
                Tuition fees for the USA campus will be confirmed with you by email once your
                application is reviewed.
              </p>
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
          Applying from Kenya or outside the United States?{" "}
          <Link href="/apply/degree" className="text-gold hover:underline">
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
