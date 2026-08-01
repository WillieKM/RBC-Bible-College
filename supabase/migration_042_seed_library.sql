-- Seed library with free, publicly accessible resources for Bible college students.
-- Admin can add, edit, or remove any entry from /admin/library at any time.

INSERT INTO library_resources (title, description, url, category) VALUES

-- ═══════════════════════════════
-- GENERAL
-- ═══════════════════════════════
('Blue Letter Bible',
 'Powerful Bible study tool with concordances, commentaries, lexicons, and original language tools. Free and highly recommended for all students.',
 'https://www.blueletterbible.org',
 'General'),

('Bible Gateway',
 'Read the Bible in over 50 translations and languages. Great for comparing translations side by side.',
 'https://www.biblegateway.com',
 'General'),

('Bible Hub',
 'Parallel Bible with interlinear text, Greek/Hebrew lexicons, commentaries, and cross-references for every verse.',
 'https://biblehub.com',
 'General'),

('Christian Classics Ethereal Library (CCEL)',
 'Free digital library of thousands of classic Christian books including works by Augustine, Calvin, Luther, Spurgeon, Wesley, and more.',
 'https://www.ccel.org',
 'General'),

('Biblical Training — Free Theology Courses',
 'Free audio lectures from seminary professors covering Bible, theology, church history, and ministry. Equivalent to full seminary courses.',
 'https://www.biblicaltraining.org',
 'General'),

('Crossway ESV Study Bible',
 'Free access to the ESV Study Bible notes, maps, and resources online.',
 'https://www.esv.org',
 'General'),

-- ═══════════════════════════════
-- OLD TESTAMENT
-- ═══════════════════════════════
('Introduction to the Old Testament — Yale Open Courses',
 'Free university-level lectures on the Hebrew Bible/Old Testament, its literary forms, and historical context.',
 'https://oyc.yale.edu/religious-studies/rlst-145',
 'Old Testament'),

('Blue Letter Bible — Hebrew Lexicon (BDB)',
 'The Brown-Driver-Briggs Hebrew lexicon for in-depth study of Old Testament Hebrew words.',
 'https://www.blueletterbible.org/lexicons/hebrew/',
 'Old Testament'),

('The Tabernacle Place',
 'Visual and textual study of the Tabernacle of Moses — layout, furnishings, and spiritual significance.',
 'https://www.thetabernacleplace.com',
 'Old Testament'),

('Old Testament Survey — BiblicalTraining.org',
 'Free audio course surveying every book of the Old Testament, taught by seminary professor Dr. Bill Mounce.',
 'https://www.biblicaltraining.org/old-testament-survey/bill-mounce',
 'Old Testament'),

-- ═══════════════════════════════
-- NEW TESTAMENT
-- ═══════════════════════════════
('Introduction to the New Testament — Yale Open Courses',
 'Free university-level lectures covering the New Testament writings, their context, authorship, and theology.',
 'https://oyc.yale.edu/religious-studies/rlst-152',
 'New Testament'),

('Blue Letter Bible — Greek Lexicon (BDAG)',
 'Strong''s Greek lexicon and BDAG tools for New Testament word studies.',
 'https://www.blueletterbible.org/lexicons/greek/',
 'New Testament'),

('New Testament Survey — BiblicalTraining.org',
 'Free audio course covering every New Testament book with scholarly commentary.',
 'https://www.biblicaltraining.org/new-testament-survey/mark-strauss',
 'New Testament'),

('Interlinear Greek New Testament — Scripture4all',
 'Free interlinear Greek-English New Testament for word-by-word study.',
 'https://www.scripture4all.org',
 'New Testament'),

-- ═══════════════════════════════
-- THEOLOGY
-- ═══════════════════════════════
('Systematic Theology — Wayne Grudem (Summary)',
 'Overview of Grudem''s classic systematic theology covering all major Christian doctrines. One of the most widely used seminary textbooks.',
 'https://www.crossway.org/books/systematic-theology-hccase/',
 'Theology'),

('Ligonier Ministries — Free Theology Resources',
 'Teaching articles, devotionals, and free courses from R.C. Sproul and other Reformed theologians covering every area of Christian doctrine.',
 'https://www.ligonier.org/learn',
 'Theology'),

('Desiring God — Theology Articles',
 'Thousands of free articles, sermons, and books on biblical theology from John Piper and contributors.',
 'https://www.desiringgod.org/topics/theology',
 'Theology'),

('The Gospel Coalition — Theology',
 'Peer-reviewed theology articles, book reviews, and biblical commentary written by leading evangelical scholars.',
 'https://www.thegospelcoalition.org/topics/theology/',
 'Theology'),

('Institutes of the Christian Religion — John Calvin',
 'Calvin''s foundational systematic theology, free to read on CCEL. Essential for understanding Reformed theology.',
 'https://www.ccel.org/ccel/calvin/institutes',
 'Theology'),

('Monergism — Free Theology Books & Articles',
 'Large collection of free Reformed theology essays, e-books, and sermon transcripts organized by topic.',
 'https://www.monergism.com',
 'Theology'),

-- ═══════════════════════════════
-- CHURCH HISTORY
-- ═══════════════════════════════
('Church History — Philip Schaff (CCEL)',
 'Philip Schaff''s comprehensive 8-volume church history from the apostolic age to the Reformation. Free and authoritative.',
 'https://www.ccel.org/ccel/schaff/hcc1',
 'Church History'),

('History of the Christian Church — BiblicalTraining.org',
 'Free audio course on church history from the early church through the modern era.',
 'https://www.biblicaltraining.org/history-of-the-christian-church/bruce-shelley',
 'Church History'),

('Early Church Fathers — CCEL',
 'Complete collection of writings from the Ante-Nicene and Post-Nicene Fathers of the Church, free to read online.',
 'https://www.ccel.org/fathers',
 'Church History'),

('Ligonier — Church History Articles',
 'Accessible articles on key figures and events in church history — Luther, Calvin, Athanasius, Augustine, the Reformation, and more.',
 'https://www.ligonier.org/learn/topics/church-history',
 'Church History'),

-- ═══════════════════════════════
-- HOMILETICS
-- ═══════════════════════════════
('Haddon Robinson — Biblical Preaching',
 'Summary and resources related to Haddon Robinson''s landmark work on expository preaching methodology.',
 'https://www.gordonconwell.edu/about/haddon-robinson/',
 'Homiletics'),

('Preaching Today — Free Sermons & Tips',
 'Free preaching resources, sermon illustrations, and guidance from Christianity Today''s preaching resource site.',
 'https://www.preachingtoday.com',
 'Homiletics'),

('Desiring God — Preaching Resources',
 'Free articles and videos on the theology and practice of expository preaching.',
 'https://www.desiringgod.org/topics/preaching',
 'Homiletics'),

('9Marks — Expository Preaching',
 'Articles and resources on what makes a faithful expository sermon, from the 9Marks church health ministry.',
 'https://www.9marks.org/answers/what-is-expository-preaching/',
 'Homiletics'),

-- ═══════════════════════════════
-- PASTORAL MINISTRY
-- ═══════════════════════════════
('9Marks — Church Health Resources',
 'Free books, articles, and interviews on biblical church membership, discipline, elders, and pastoral ministry.',
 'https://www.9marks.org',
 'Pastoral Ministry'),

('The Gospel Coalition — Pastoral Ministry',
 'Resources for pastors on preaching, counselling, leading, and caring for a congregation.',
 'https://www.thegospelcoalition.org/topics/pastoral-ministry/',
 'Pastoral Ministry'),

('Ligonier — Ministry & Leadership',
 'Articles and teaching on pastoral calling, church governance, and shepherding the flock.',
 'https://www.ligonier.org/learn/topics/ministry',
 'Pastoral Ministry'),

('Desiring God — For Pastors',
 'John Piper''s resources specifically for pastors, including articles on pastoral burnout, joy in ministry, and shepherd leadership.',
 'https://www.desiringgod.org/topics/pastors',
 'Pastoral Ministry'),

-- ═══════════════════════════════
-- MISSIONS
-- ═══════════════════════════════
('Lausanne Movement — Missions Resources',
 'Global evangelical missiology resources, the Cape Town Commitment, and papers from the world''s leading mission thinkers.',
 'https://www.lausanne.org/resources',
 'Missions'),

('Joshua Project — Global Unreached Peoples',
 'Data and prayer resources for every unreached people group in the world. Essential for missions education.',
 'https://joshuaproject.net',
 'Missions'),

('Desiring God — Missions',
 'Free articles, sermons, and books on the theology of missions, world evangelism, and cross-cultural ministry.',
 'https://www.desiringgod.org/topics/missions',
 'Missions'),

('Operation World',
 'Country-by-country prayer guide for the nations. The standard prayer and missions reference for global intercession.',
 'https://www.operationworld.org',
 'Missions'),

-- ═══════════════════════════════
-- CHRISTIAN LIVING
-- ═══════════════════════════════
('Desiring God — Christian Living',
 'Thousands of free articles on living the Christian life — relationships, suffering, work, money, race, culture, and more.',
 'https://www.desiringgod.org/topics/christian-living',
 'Christian Living'),

('The Gospel Coalition — Christian Living',
 'Practical, gospel-centred articles for everyday life as a follower of Christ.',
 'https://www.thegospelcoalition.org/topics/christian-living/',
 'Christian Living'),

('Knowing God — J.I. Packer (CCEL)',
 'Classic summary and study notes for J.I. Packer''s foundational book on knowing and living for God.',
 'https://www.ccel.org/ccel/packer/knowing',
 'Christian Living'),

('The Pilgrim''s Progress — John Bunyan (Free)',
 'Full text of Bunyan''s timeless Christian allegory, one of the best-selling books of all time.',
 'https://www.ccel.org/ccel/bunyan/pilgrim',
 'Christian Living'),

-- ═══════════════════════════════
-- PRAYER
-- ═══════════════════════════════
('E.M. Bounds — Power Through Prayer (Free)',
 'Classic text on the necessity and power of prayer in ministry by E.M. Bounds. Essential reading for every student.',
 'https://www.ccel.org/ccel/bounds/power',
 'Prayer'),

('Desiring God — Prayer Resources',
 'Articles, sermons, and books on developing a powerful and consistent prayer life.',
 'https://www.desiringgod.org/topics/prayer',
 'Prayer'),

('24-7 Prayer — Resources',
 'Practical prayer tools, devotionals, and guides for personal and corporate prayer.',
 'https://www.24-7prayer.com/resources',
 'Prayer'),

('Operation World — Daily Prayer Guide',
 'Pray for a different country each day of the year using the world''s leading prayer resource for world missions.',
 'https://www.operationworld.org/pray-for-the-world/',
 'Prayer');
