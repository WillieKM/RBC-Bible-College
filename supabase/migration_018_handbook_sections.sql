-- Add section grouping to handbook_pages
alter table handbook_pages add column if not exists section text not null default 'General';

-- Seed the full bible school student handbook
-- Run this ONCE after migration_015 and migration_018 have been applied.
-- Safe to re-run — uses ON CONFLICT DO NOTHING based on (section, sort_order).

-- We use a unique constraint so re-runs are idempotent
alter table handbook_pages drop constraint if exists handbook_pages_section_sort_order_key;
alter table handbook_pages add constraint handbook_pages_section_sort_order_key unique (section, sort_order);

insert into handbook_pages (title, body, section, sort_order) values

-- ─── WELCOME ────────────────────────────────────────────────────────────────
(
  'Welcome from the Director',
  'Welcome to Revelation Bible College International (RBC International).

We are delighted to have you as part of our growing community of students who are passionate about the Word of God and committed to serving His Kingdom. This handbook has been prepared to guide you through your time with us and to help you make the most of your studies.

At RBC International, we believe that theological education is not merely an academic exercise — it is a divine calling. You are here because God has placed a desire in your heart to know Him more deeply, to understand His Word more accurately, and to serve His people more effectively.

We encourage you to approach every module, every assignment, and every interaction with your professors and fellow students as an opportunity to grow in wisdom, character, and faith.

Our prayer is that your time here will transform you — not just academically, but spiritually and practically — equipping you to make a lasting impact in your community and beyond.

Welcome to the family.

In His Service,
The Director
Revelation Bible College International',
  'Welcome',
  10
),

(
  'Our Vision & Mission',
  'VISION
To raise a generation of Spirit-filled, Word-grounded leaders who transform nations through the power of the Gospel.

MISSION
Revelation Bible College International exists to provide accessible, high-quality theological education that equips men and women for effective Christian ministry. We are committed to developing leaders of integrity who are rooted in Scripture, sensitive to the Holy Spirit, and responsive to the needs of the world around them.

WHAT WE BELIEVE ABOUT EDUCATION
We believe education is most powerful when it combines sound doctrine with practical application. Every course we offer is designed not only to fill the mind but to stir the heart and sharpen the hands for ministry.

We serve students across Africa, the United States, and the wider international community — and we are committed to making theological training available regardless of geography or financial background.',
  'Welcome',
  20
),

(
  'Statement of Faith',
  'We believe in the following core doctrines of the Christian faith:

THE BIBLE
We believe the Holy Bible — Old and New Testaments — is the inspired, infallible, and authoritative Word of God. It is the supreme standard by which all human conduct, creeds, and opinions shall be tried.

THE GODHEAD
We believe in one God, eternally existing in three persons — Father, Son, and Holy Spirit — co-equal and co-eternal.

JESUS CHRIST
We believe in the virgin birth, sinless life, atoning death, bodily resurrection, and physical return of Jesus Christ. He is fully God and fully man — the only Saviour of mankind.

THE HOLY SPIRIT
We believe in the person and work of the Holy Spirit, including His baptism with the evidence of speaking in tongues, and His ongoing ministry of sanctification, spiritual gifts, and empowerment for service.

SALVATION
We believe that salvation is by grace through faith in Jesus Christ alone. Repentance, faith, and new birth are essential to a right relationship with God.

THE CHURCH
We believe in the universal Church — the Body of Christ — comprised of all true believers. We affirm the importance of the local church for fellowship, discipleship, and outreach.

THE SECOND COMING
We believe in the literal, bodily, imminent return of Jesus Christ to establish His Kingdom.',
  'Welcome',
  30
),

(
  'Core Values',
  'SCRIPTURE FIRST
Every doctrine we teach, every policy we hold, and every decision we make is measured against the Word of God. We are committed to sound biblical scholarship.

INTEGRITY
We hold ourselves and our students to the highest standards of honesty, transparency, and moral character — in the classroom and in life.

EXCELLENCE
We pursue excellence not for the praise of men, but as an act of worship to God who deserves our best. Average is not our standard.

SERVANT LEADERSHIP
Leadership at RBC International is modelled after Jesus — who came not to be served but to serve. We develop leaders who give, not those who take.

COMMUNITY
Iron sharpens iron. We believe theological education happens best in community, where students challenge, encourage, and pray for one another.

ACCESSIBILITY
The call of God does not discriminate by geography, income, or background. We are committed to making quality education available to those whom God has called, wherever they are.',
  'Welcome',
  40
),

-- ─── ACADEMIC POLICIES ──────────────────────────────────────────────────────
(
  'Grading System',
  'RBC International uses the following grading scale:

LETTER GRADES
A   (90 – 100%)   Excellent — Demonstrates outstanding mastery of the subject
B   (80 – 89%)    Good — Demonstrates strong understanding above requirements
C   (70 – 79%)    Satisfactory — Meets the minimum requirements of the course
D   (60 – 69%)    Below standard — Partial understanding; improvement required
F   (Below 60%)   Fail — Insufficient understanding; module must be retaken

CREDIT REQUIREMENTS
Each module carries a specified number of credits (typically 3 credits per module). Students must pass all modules in their program to qualify for their certificate, diploma, or degree.

GRADE APPEALS
If a student believes a grade has been awarded in error, they may submit a written appeal to the academic office within 14 days of receiving the grade. Appeals must include specific grounds for review. Grades will not be changed on the basis of effort alone — they reflect demonstrated academic performance.

ACADEMIC STANDING
Students who fall below 60% in two or more modules in a single term will be placed on academic probation and are required to meet with their academic advisor.',
  'Academic Policies',
  50
),

(
  'Attendance Policy',
  'Regular attendance is essential to your academic success and is a reflection of your commitment to your calling.

EXPECTED ATTENDANCE
Students are expected to be present and engaged for all scheduled sessions, live classes, and interactive submissions.

ABSENCE POLICY
• Up to 2 absences per module: No academic penalty (student responsible for missed content)
• 3 absences: Written warning issued
• 4 or more absences: Student may be withdrawn from the module and required to retake it

LATE ARRIVALS
Arriving more than 15 minutes late to a scheduled session counts as a half-absence. Persistent lateness disrupts the learning environment and will be addressed by the professor.

EXTENUATING CIRCUMSTANCES
In cases of serious illness, bereavement, or other genuine emergencies, students should notify the academic office as soon as possible. Documentation may be required. The college will work compassionately with students facing genuine hardship.

ONLINE STUDENTS
Online students are expected to remain current with coursework deadlines and participate actively in discussion boards and submission portals. Inactivity for 14 consecutive days without notice constitutes an unexcused absence.',
  'Academic Policies',
  60
),

(
  'Assignment Submission & Academic Integrity',
  'SUBMITTING ASSIGNMENTS
All assignments must be submitted through the student portal by the stated deadline. Late submissions will be penalised as follows:

• 1–3 days late: 10% deduction
• 4–7 days late: 20% deduction
• More than 7 days late: Assignment not accepted; zero awarded

Extensions may be granted at the discretion of the professor if requested at least 48 hours before the deadline. Extensions will not be granted retroactively.

ACADEMIC INTEGRITY
RBC International holds a zero-tolerance policy on academic dishonesty. This includes:

Plagiarism — Submitting another person''s work as your own, whether from a book, website, fellow student, or AI tool without proper acknowledgment.

Fabrication — Inventing or falsifying data, sources, or research.

Cheating — Using unauthorised materials or assistance during assessments.

Collusion — Submitting work that was not completed independently unless group work was explicitly permitted.

CONSEQUENCES
First offence: Zero on the assignment and a written warning placed on the student''s file.
Second offence: Automatic failure of the module.
Third offence: Dismissal from the program.

PROPER CITATION
Students are encouraged to research widely. When quoting or drawing from external sources, always cite them properly. Using others'' insights with attribution is scholarship; using them without attribution is theft.',
  'Academic Policies',
  70
),

(
  'Thesis & Dissertation Requirements',
  'Diploma and degree programs include a final thesis or dissertation as a requirement for graduation.

DIPLOMA — THESIS (500 words minimum)
Students must write a 500-word thesis on any module topic they have studied. The thesis must demonstrate understanding, personal reflection, and scriptural support. Students will present their thesis for 15 minutes before a panel of adjunct faculty.

BACHELOR OF THEOLOGY — DISSERTATION (20,000 words)
Students must produce a 20,000-word dissertation on a theological topic of their choice, demonstrating research ability, biblical exegesis, and original thinking. A formal 20-minute presentation to a faculty panel is required.

MASTER OF THEOLOGY — DISSERTATION (40,000 words)
The M.Th. dissertation requires 40,000 words of original research on a significant theological subject. A 20-minute presentation to a panel of adjunct faculty and external examiners is required.

SUBMISSION GUIDELINES
• Work must be original and the student''s own
• All external sources must be cited in a recognised format (APA, MLA, or Chicago)
• Electronic submission through the student portal is required
• Hard copies may also be required — your program coordinator will advise

DISSERTATION SUPERVISOR
Each student will be assigned a supervisor who will provide guidance throughout the research and writing process. Students are expected to meet with their supervisor regularly and respond to feedback promptly.',
  'Academic Policies',
  80
),

-- ─── STUDENT CONDUCT ────────────────────────────────────────────────────────
(
  'Code of Conduct',
  'As students of RBC International, you are ambassadors of Christ and representatives of this institution. The following standards of conduct are expected at all times.

RESPECT
Treat every person — fellow students, professors, administrative staff, and the public — with dignity, kindness, and respect. Bullying, harassment, discrimination, or any form of intimidation will not be tolerated.

HONESTY
Speak truth. Honour your commitments. If you cannot meet a deadline or fulfil an obligation, communicate early and honestly rather than allowing others to be disappointed without warning.

LANGUAGE
We expect all communication — verbal, written, and digital — to be wholesome, edifying, and free from profanity, vulgarity, or language that degrades others.

MORAL PURITY
We affirm the biblical standard of sexual morality — that sexual intimacy is reserved for marriage between a man and a woman. We expect students to conduct themselves accordingly in all relationships.

SOCIAL MEDIA
Students must not post content that brings RBC International into disrepute, shares confidential information about other students or staff, or misrepresents the college''s teaching. Online conduct is subject to the same standards as in-person conduct.

SUBSTANCE USE
Students are expected to abstain from the use of alcohol, tobacco, and illegal substances during their time as enrolled students. This is a matter of personal witness as well as health.

CONFLICT RESOLUTION
If a conflict arises between students, the first step is always to address it directly and privately in a spirit of Matthew 18. If unresolved, bring the matter to the academic office.',
  'Student Conduct',
  90
),

(
  'Dress Code',
  'We believe that appearance reflects attitude and that how we present ourselves matters — both to God and to those we serve.

GENERAL STANDARD
Students are expected to dress modestly, neatly, and professionally at all times during academic activities, chapel sessions, and college events.

FOR ALL STUDENTS
• Clothing should be clean, pressed, and in good repair
• Clothing with offensive, crude, or non-Christian messaging is not permitted
• Extremes of fashion that draw undue attention to oneself are discouraged

FOR FEMALE STUDENTS
• Modest dress that does not expose the midriff, back, or chest
• Skirts and dresses should fall at or below the knee
• Leggings worn as outerwear are not appropriate for formal sessions

FOR MALE STUDENTS
• Collared shirts or smart casual attire for formal sessions
• Trousers worn at the waist
• Hats and caps should be removed during prayer, worship, and formal teaching sessions

ONLINE STUDENTS
While we understand home learning offers flexibility, students attending live online sessions are still expected to dress appropriately on camera. Appearing in pyjamas or casual sleeping attire during formal sessions is not acceptable.

CHAPEL & SPECIAL EVENTS
Formal or smart casual dress is required for chapel services, graduation ceremonies, and any event where you represent the college publicly.',
  'Student Conduct',
  100
),

(
  'Digital & Social Media Policy',
  'We live in a digital age, and how we engage online has real consequences for our witness, our relationships, and the reputation of this institution.

RESPONSIBLE USE
• Use social media to encourage, edify, and share the Gospel — not to tear down, gossip, or stir up conflict
• Think before you post: ask yourself whether what you are sharing honours God and treats others with dignity

CONFIDENTIALITY
• Do not share another student''s personal information, struggles, or private conversations online — even with good intentions
• Content shared in classroom discussions, prayer groups, or counselling settings is confidential

REPRESENTING THE COLLEGE
• When identifying yourself as a student of RBC International online, you are implicitly representing the institution
• Do not make statements on behalf of the college or claim to represent its official position unless authorised
• If you disagree with a college policy, raise it through proper channels — not on social media

PROHIBITED CONTENT
• Posting or sharing sexually explicit, violent, or hateful content
• Cyberbullying or harassing any person connected to the college
• Sharing unverified or false information about the college, its staff, or students

CONSEQUENCES
Violations of this policy may result in disciplinary action up to and including suspension or dismissal, depending on the severity of the offence.',
  'Student Conduct',
  110
),

-- ─── FINANCIAL POLICIES ─────────────────────────────────────────────────────
(
  'Tuition & Fee Policy',
  'RBC International is committed to making theological education accessible. Our fees are structured to reflect the region of the student and the program of study.

FEE STRUCTURE
Fees vary by program and by region. Your specific fee will appear on your student invoice in the portal under "My Invoices" when you are enrolled. All amounts are clearly labelled with your applicable currency (KSh for Kenya/International; $ for USA).

WHAT YOUR FEES COVER
• Access to all course materials and module content
• Professor-led instruction and feedback on all assignments
• Use of the student portal for the duration of your program
• A certificate, diploma, or degree upon successful completion
• Thesis/dissertation supervision where applicable

WHAT IS NOT INCLUDED
• Printing costs for physical materials
• Graduation ceremony attendance fees (if applicable)
• Application fees for accreditation with external bodies

FINANCIAL HARDSHIP
We understand that financial circumstances can change. Students facing genuine hardship are encouraged to speak confidentially with the administrative office. We will endeavour to work out a solution that keeps you in your program wherever possible.

NO STUDENT WILL BE EXCLUDED FROM LEARNING FOR FINANCIAL REASONS ALONE. We believe God provides for those He calls, and we partner with Him in that provision.',
  'Financial Policies',
  120
),

(
  'Payment Schedule & Refund Policy',
  'PAYMENT SCHEDULE
Full payment of program fees is due within 30 days of enrolment confirmation unless a payment plan has been agreed with the administrative office.

PAYMENT PLANS
Students may request a structured payment plan by contacting the administrative office before their payment due date. Approved payment plans will be reflected in your invoice history on the portal.

OVERDUE ACCOUNTS
Students with overdue fees may have their access to course materials restricted until the account is brought current. You will be notified via email and the portal before any restriction is applied.

CERTIFICATES & TRANSCRIPTS
Official certificates, diplomas, degrees, and transcripts will only be issued to students with a fully cleared account.

REFUND POLICY
• Withdrawal within 7 days of enrolment: Full refund
• Withdrawal within 14 days: 75% refund
• Withdrawal within 30 days: 50% refund
• Withdrawal after 30 days: No refund

EXCEPTIONAL CIRCUMSTANCES
In cases of serious illness, bereavement, or other extraordinary circumstances, refund requests outside the above schedule will be considered on a case-by-case basis. Written documentation is required.

PAYMENT METHODS
Payment details and available methods are provided in your invoice. Contact the administrative office for assistance.',
  'Financial Policies',
  130
),

-- ─── PROGRAMS & GRADUATION ──────────────────────────────────────────────────
(
  'Program Overview',
  'RBC International offers the following accredited programs:

CERTIFICATE IN BIBLICAL STUDIES (CBS)
Duration: Approximately 1 year | Credits: 30
An introductory program covering the foundational truths of the Christian faith. Ideal for new believers, lay leaders, and those beginning their theological journey. No prior theological education required.

DIPLOMA IN BIBLICAL STUDIES (DBS)
Duration: Approximately 1 year | Credits: 66
A comprehensive program providing a thorough grounding in biblical theology, church ministry, and practical leadership. Suitable for those preparing for ministry or wishing to deepen their biblical understanding.

BACHELOR OF THEOLOGY — B.Th.
Duration: Approximately 2 years | Credits: 54 (plus Diploma prerequisite)
A degree-level program for those pursuing full-time ministry, teaching, or pastoral leadership. Includes a major dissertation and presentation.

MASTER OF THEOLOGY — M.Th.
Duration: Approximately 1–2 years | Credits: 40 (plus B.Th. prerequisite)
An advanced research degree for experienced ministers and academics. Requires a 40,000-word dissertation and formal presentation to faculty.

PROGRAM PROGRESSION
Students may progress from one level to the next upon successful completion of all modules and clearance of financial obligations. Prior learning from other accredited institutions may be considered for credit transfer — contact the academic office for assessment.',
  'Programs & Graduation',
  140
),

(
  'Graduation Requirements',
  'To qualify for a Certificate, Diploma, Degree, or Master''s award from RBC International, students must fulfil all of the following:

ACADEMIC REQUIREMENTS
• Successful completion of all modules in the program (minimum passing grade of 60% in each)
• Submission and approval of the required thesis or dissertation (where applicable)
• A satisfactory oral presentation before the faculty panel (Diploma, B.Th., and M.Th.)

CONDUCT REQUIREMENTS
• Maintenance of good standing throughout the program — no active disciplinary sanctions at the time of graduation
• Demonstration of Christian character consistent with the values of the college

FINANCIAL REQUIREMENTS
• Full clearance of all outstanding tuition and program fees
• Return of any college-issued materials where applicable

GRADUATION CEREMONY
RBC International holds graduation ceremonies periodically. Students who have met all requirements will be notified of the next available ceremony date. Attendance at the ceremony is encouraged but not mandatory — graduates who cannot attend will receive their award by registered post or digital certification.

HONOURS
Academic honours are awarded to graduates who achieve the following overall averages:
• Pass: 60–69%
• Merit: 70–79%
• Distinction: 80–89%
• High Distinction: 90–100%

DIGITAL CERTIFICATES
All graduates receive a digital certificate accessible through the student portal. Physical certificates are available on request.',
  'Programs & Graduation',
  150
),

-- ─── STUDENT LIFE ───────────────────────────────────────────────────────────
(
  'Spiritual Life & Devotions',
  'RBC International is not merely an academic institution — it is a community of believers who believe that theological education and spiritual formation are inseparable.

PERSONAL DEVOTIONS
We strongly encourage every student to maintain a daily devotional life — time in prayer, worship, and the reading of Scripture. Your academic knowledge must be fuelled by a living relationship with God if it is to bear fruit in ministry.

CHAPEL & CORPORATE WORSHIP
Where chapel or corporate worship services are scheduled for your cohort, attendance is part of your formation as a minister. These are not optional extras — they are central to the RBC experience.

PRAYER CULTURE
We are a house of prayer. Students are encouraged to pray for one another, for their professors, for the college, and for the nations. Intercession is a ministry in itself.

PASTORAL SUPPORT
Every student has access to pastoral support through the college. If you are struggling spiritually, emotionally, or in any other area of life, please do not hesitate to reach out. We would rather walk with you through difficulty than lose you to it.

SPIRITUAL GIFTS
We affirm and encourage the operation of all the gifts of the Holy Spirit within a context of order, love, and biblical accountability. Students are encouraged to grow in their gifts throughout their time with us.',
  'Student Life',
  160
),

(
  'Community Standards & Relationships',
  'BUILDING COMMUNITY
The relationships you form during your time at RBC International may be among the most significant of your ministry life. Invest in them wisely.

ENCOURAGING ONE ANOTHER
Hebrews 10:24–25 calls us to "stir one another up to love and good works." Take this seriously. Celebrate your fellow students'' achievements, pray for them in their struggles, and choose to speak life.

RESOLVING CONFLICT
Conflict is inevitable in any community. What matters is how it is handled.
1. Go directly to the person — do not involve others unnecessarily (Matthew 18:15)
2. Approach the conversation with humility, not to win but to reconcile
3. If direct conversation fails, bring in a neutral third party (a professor or pastoral staff member)
4. Only escalate to the academic office if these steps have failed

ROMANTIC RELATIONSHIPS
Students in romantic relationships are expected to conduct themselves with propriety, discretion, and biblical integrity at all times. Behaviour that causes distraction, offence, or scandal to the community will be addressed.

CROSS-CULTURAL RESPECT
RBC International serves students from many nations, cultures, and backgrounds. We celebrate this diversity as a reflection of the Kingdom of God. Prejudice, mockery, or dismissiveness toward any cultural expression is inconsistent with the love of Christ and will be treated as a conduct violation.',
  'Student Life',
  170
),

(
  'Disciplinary Procedures',
  'RBC International is committed to a fair, consistent, and redemptive approach to discipline. Our goal is always restoration, not punishment — but standards must be maintained for the good of the whole community.

CATEGORIES OF MISCONDUCT
Minor Misconduct: Lateness, dress code violations, disrespect in class, late submissions
Serious Misconduct: Plagiarism, bullying, harassment, financial dishonesty
Gross Misconduct: Sexual immorality, criminal activity, sustained defiance of authority, conduct that causes serious harm to another person

PROCESS FOR MINOR MISCONDUCT
1. Verbal warning from professor or administrative staff
2. Written warning placed on student file
3. Further incidents escalate to Serious Misconduct procedure

PROCESS FOR SERIOUS MISCONDUCT
1. Student is notified in writing of the allegation
2. Student has the right to respond in writing within 7 days
3. Review committee meets to consider the evidence
4. Outcome communicated in writing — may include suspension or a performance improvement agreement

PROCESS FOR GROSS MISCONDUCT
1. Immediate suspension pending investigation
2. Full review with opportunity for student to be heard
3. Outcome may include permanent dismissal from the program

RIGHT OF APPEAL
Any student who believes a disciplinary decision was unfair or procedurally incorrect may appeal in writing to the Director within 14 days of the decision. The Director''s decision is final.

OUR POSTURE
We discipline because we care. Every action taken under this policy is taken with the desire to see the student restored — to God, to the community, and to their calling.',
  'Student Life',
  180
),

(
  'Support & Contact Information',
  'RBC International is here to support you every step of the way. Do not hesitate to reach out.

ACADEMIC SUPPORT
• Questions about modules, assignments, or grades: Contact your assigned professor through the student portal
• Questions about your program, credits, or graduation requirements: Contact the academic office

FINANCIAL SUPPORT
• Billing questions, payment plans, or fee concerns: Contact the administrative office through the portal
• Students facing financial hardship should speak with the Director''s office in confidence

TECHNICAL SUPPORT
• Problems accessing the student portal: Contact the technical support team
• Portal issues during assessment deadlines will be treated as extenuating circumstances — document the issue and notify the academic office immediately

PASTORAL SUPPORT
• Spiritual struggles, personal difficulties, or counselling needs: Reach out to pastoral staff
• All pastoral conversations are held in strict confidence unless there is a risk of harm

GENERAL ENQUIRIES
Use the contact form on the student portal or send an email to the administrative address listed in your welcome email.

OUR COMMITMENT TO YOU
No question is too small. No struggle is too big. We are a family — and in this family, no one walks alone.

"Bear one another''s burdens, and so fulfil the law of Christ." — Galatians 6:2',
  'Student Life',
  190
)

on conflict (section, sort_order) do nothing;
