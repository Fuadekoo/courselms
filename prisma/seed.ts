import prisma from "@/lib/db";

(async () => {
  try {
    // Create users (or update if they exist)
    const manager = await prisma.user.upsert({
      where: { phoneNumber: "+251945467891" },
      update: {},
      create: {
        role: "manager",
        firstName: "abdelkerim",
        fatherName: "ahmed",
        lastName: "mohammed",
        phoneNumber: "+251945467891",
        password:
          "$2a$12$Wt8Q9Q23DmCEiVPucCrTcOTxtYRkNUhK5MoyaJotYBc1RbJdUbk0W",
        permission: {
          create: { permission: "manager" },
        },
      },
    });
    await prisma.user.upsert({
      where: { phoneNumber: "+251942303571" },
      update: {},
      create: {
        role: "student",
        firstName: "mubarek",
        fatherName: "ahmed",
        lastName: "mohammed",
        phoneNumber: "+251942303571",
        password:
          "$2a$12$Wt8Q9Q23DmCEiVPucCrTcOTxtYRkNUhK5MoyaJotYBc1RbJdUbk0W",
        status: "active",
      },
    });

    const instructor = await prisma.user.upsert({
      where: { phoneNumber: "+251910203040" },
      update: {},
      create: {
        role: "instructor",
        firstName: "Fuad",
        fatherName: "Abdurahaman",
        lastName: "Kalid",
        phoneNumber: "+251910203040",
        password:
          "$2a$12$MdcOCCZBmPTAfKFbke.ObOT9gED00eqsdQEfttlrQixjmjJMWR/wW",
        status: "active",
      },
    });

    const seller = await prisma.user.upsert({
      where: { phoneNumber: "+251945467893" },
      update: {},
      create: {
        role: "seller",
        firstName: "abubeker",
        fatherName: "ahmed",
        lastName: "mohammed",
        phoneNumber: "+251945467893",
        password:
          "$2a$12$MdcOCCZBmPTAfKFbke.ObOT9gED00eqsdQEfttlrQixjmjJMWR/wW",
        status: "active",
      },
    });

    const affiliate = await prisma.user.upsert({
      where: { phoneNumber: "+251933807447" },
      update: {},
      create: {
        role: "affiliate",
        firstName: "ahmed",
        fatherName: "ahmed",
        lastName: "mohammed",
        phoneNumber: "+251933807447",
        password:
          "$2a$12$XXbCwSgHeM0s63IRM4B6ROYNBWikkPxk3sHsrPRSoO0.EOl6dLvtm",
        status: "active",
      },
    });

    // Create multiple channels for different course categories
    const channels = [];
    const channelData = [
      { chatId: -1002346735030, title: "Quran" },
      { chatId: -1002465362272, title: "Hadith" },
      { chatId: -1002346735031, title: "Arabic" },
      { chatId: -1002346735032, title: "Tajweed" },
      { chatId: -1002346735033, title: "Memorization" },
      { chatId: -1002346735034, title: "Islamic History" },
      { chatId: -1002346735035, title: "Aqeedah" },
      { chatId: -1002346735036, title: "Competition" },
      { chatId: -1002346735037, title: "Tafsir" },
      { chatId: -1002346735038, title: "General" },
    ];

    for (const channelInfo of channelData) {
      const channel = await prisma.channel.upsert({
        where: { chatId: channelInfo.chatId },
        update: {},
        create: { chatId: channelInfo.chatId, title: channelInfo.title },
      });
      channels.push(channel);
    }

    // Create 10 comprehensive courses
    const courses = [
      {
        titleEn: "Basic Arabic Letters - Qaida Part 1",
        titleAm: "(ቃኢዳ) ክፍል አንድ - የአረብኛ ፊደላት",
        aboutEn:
          "Learn the fundamentals of Arabic letters and pronunciation. Perfect for beginners starting their Quran journey.",
        aboutAm:
          "የአረብኛ ፊደላት እና ትክክለኛ ንባብ የመማሪያ መሰረት። ቁርአን የሚማሩ ጀማሪዎች ይህን ኮርስ ይማሩ።",
        price: 200,
        birrPrice: 1500,
        dolarPrice: 10,
        level: "beginner",
        language: "amharic",
        duration: "02:30",
        certificate: true,
        thumbnail: "/thumbnails/qaida1.jpg",
      },
      {
        titleEn: "Arabic Letter Joining - Qaida Part 2",
        titleAm: "(ቃኢዳ) ክፍል ሁለት - የፊደላት መያያዝ",
        aboutEn:
          "Master the art of joining Arabic letters to form words. Essential step before reading Quran.",
        aboutAm: "የአረብኛ ፊደላትን ወደ ቃላት ለመለወጥ የሚያስችል መሰረታዊ ክህሎት።",
        price: 250,
        birrPrice: 1800,
        dolarPrice: 12,
        level: "beginner",
        language: "amharic",
        duration: "03:00",
        certificate: true,
        thumbnail: "/thumbnails/qaida2.jpg",
      },
      {
        titleEn: "Quran Reading with Tajweed - Basic Level",
        titleAm: "ተጅዊድ ጋር የቁርአን ንባብ - መሰረታዊ ደረጃ",
        aboutEn:
          "Learn to read Quran with proper Tajweed rules. Focus on pronunciation and recitation techniques.",
        aboutAm: "በትክክለኛ የተጅዊድ ህጎች ቁርአንን ንባብ ይማሩ።",
        price: 400,
        birrPrice: 2500,
        dolarPrice: 18,
        level: "intermediate",
        language: "amharic",
        duration: "04:30",
        certificate: true,
        thumbnail: "/thumbnails/tajweed-basic.jpg",
      },
      {
        titleEn: "Quran Memorization - Surah Al-Fatiha to Al-Ma'un",
        titleAm: "የቁርአን ሂፍዝ - አልፋቲሃ እስከ አልማዑን",
        aboutEn:
          "Memorize the first 7 Surahs of the Quran with proper understanding and pronunciation.",
        aboutAm: "የቁርአን የመጀመሪያ 7 ሱራቶችን በትክክለኛ ማስተዋል እና ንባብ ይማሩ።",
        price: 500,
        birrPrice: 3000,
        dolarPrice: 25,
        level: "intermediate",
        language: "amharic",
        duration: "06:00",
        certificate: true,
        thumbnail: "/thumbnails/hifz-basic.jpg",
      },
      {
        titleEn: "Advanced Tajweed - Mastering Quran Recitation",
        titleAm: "የላቀ ተጅዊድ - የቁርአን ንባብ ብቃት",
        aboutEn:
          "Advanced Tajweed rules for beautiful and correct Quran recitation. For serious learners.",
        aboutAm: "ለጥሩ እና ትክክለኛ የቁርአን ንባብ የላቀ የተጅዊድ ህጎች።",
        price: 600,
        birrPrice: 3500,
        dolarPrice: 30,
        level: "advanced",
        language: "amharic",
        duration: "08:00",
        certificate: true,
        thumbnail: "/thumbnails/tajweed-advanced.jpg",
      },
      {
        titleEn: "Quran Translation and Tafsir - Juz Amma",
        titleAm: "የቁርአን ትርጉም እና ታፍሲር - ጀዙአማ",
        aboutEn:
          "Understand the meaning and interpretation of the last 30 Surahs of the Quran.",
        aboutAm: "የቁርአን የመጨረሻ 30 ሱራቶችን ትርጉም እና ትርጓሜ ይማሩ።",
        price: 450,
        birrPrice: 2800,
        dolarPrice: 22,
        level: "intermediate",
        language: "amharic",
        duration: "10:00",
        certificate: true,
        thumbnail: "/thumbnails/tafsir-juzamma.jpg",
      },
      {
        titleEn: "Islamic Aqeedah - Basic Beliefs",
        titleAm: "የኢስላም ዒቃድ - መሰረታዊ እምነቶች",
        aboutEn:
          "Learn the fundamental beliefs of Islam in a simple and comprehensive way.",
        aboutAm: "የኢስላም መሰረታዊ እምነቶችን በቀላል እና ሙሉ መንገድ ይማሩ።",
        price: 300,
        birrPrice: 2000,
        dolarPrice: 15,
        level: "beginner",
        language: "amharic",
        duration: "05:00",
        certificate: true,
        thumbnail: "/thumbnails/aqeedah-basic.jpg",
      },
      {
        titleEn: "Hadith Studies - Forty Hadith Collection",
        titleAm: "የሀዲስ ጥናት - አርባ ሀዲስ ስብስብ",
        aboutEn:
          "Study and memorize 40 important Hadiths with their meanings and applications.",
        aboutAm: "40 አስፈላጊ ሀዲሶችን ከትርጉማቸው እና አተገባበራቸው ጋር ይማሩ።",
        price: 350,
        birrPrice: 2200,
        dolarPrice: 18,
        level: "intermediate",
        language: "amharic",
        duration: "06:30",
        certificate: true,
        thumbnail: "/thumbnails/hadith-40.jpg",
      },
      {
        titleEn: "Islamic History - Life of Prophet Muhammad",
        titleAm: "የኢስላም ታሪክ - የነቢዩ መሐመድ ሕይወት",
        aboutEn:
          "Comprehensive study of the life and teachings of Prophet Muhammad (PBUH).",
        aboutAm: "የነቢዩ መሐመድ (ሰ.ዐ.ወ) ሕይወት እና ትምህርቶች ሙሉ ጥናት።",
        price: 400,
        birrPrice: 2500,
        dolarPrice: 20,
        level: "intermediate",
        language: "amharic",
        duration: "07:00",
        certificate: true,
        thumbnail: "/thumbnails/prophet-life.jpg",
      },
      {
        titleEn: "Quran Recitation Competition Preparation",
        titleAm: "የቁርአን ንባብ ውድድር ዝግጅት",
        aboutEn:
          "Prepare for Quran recitation competitions with advanced techniques and confidence building.",
        aboutAm: "የላቀ ቴክኒኮች እና በራስ መተማመን በማስፋት ለየቁርአን ንባብ ውድድር ዝግጅት ይሳሉ።",
        price: 800,
        birrPrice: 4500,
        dolarPrice: 35,
        level: "advanced",
        language: "amharic",
        duration: "12:00",
        certificate: true,
        thumbnail: "/thumbnails/competition-prep.jpg",
      },
    ];

    const createdCourses = [];
    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];
      // Assign different channels to different courses, or null if channel already used
      const channelIndex = i % channels.length;
      let channelId = channels[channelIndex]?.id || null;

      // Check if channel is already used
      if (channelId) {
        const existingCourseWithChannel = await prisma.course.findFirst({
          where: { channelId },
        });
        if (existingCourseWithChannel) {
          channelId = null; // Set to null if channel is already used
        }
      }

      const course = await prisma.course.create({
        data: {
          titleEn: courseData.titleEn,
          titleAm: courseData.titleAm,
          instructorId: instructor.id,
          aboutEn: courseData.aboutEn,
          aboutAm: courseData.aboutAm,
          thumbnail: courseData.thumbnail,
          video: "course-intro.mp4",
          price: courseData.price,
          birrPrice: courseData.birrPrice,
          dolarPrice: courseData.dolarPrice,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          level: courseData.level as any,
          language: courseData.language,
          duration: courseData.duration,
          certificate: courseData.certificate,
          accessEn: "Access on mobile, computer",
          accessAm: "በሞባይል ፣ በኮምፒተር ላይ መጠቀም",
          instructorRate: 10,
          sellerRate: 10,
          affiliateRate: 10,
          requirement: {
            createMany: {
              data: [
                {
                  requirementEn: "Basic understanding of Arabic letters",
                  requirementAm: "የአረብኛ ፊደላት መሰረታዊ እውቀት",
                },
                {
                  requirementEn: "Dedication to regular practice",
                  requirementAm: "ወደ መደበኛ ልምምድ ቁርጠኝነት",
                },
                {
                  requirementEn: "Commitment to complete the course",
                  requirementAm: "ኮርሱን ለማጠናቀቅ ቁርጠኝነት",
                },
              ],
            },
          },
          courseFor: {
            createMany: {
              data: [
                {
                  courseForEn: "Beginners wanting to learn Quran",
                  courseForAm: "ቁርአንን ለመማር የሚፈልጉ ጀማሪዎች",
                },
                {
                  courseForEn: "Muslims seeking spiritual growth",
                  courseForAm: "መንፈሳዊ እድገትን የሚፈልጉ ሙስሊሞች",
                },
                {
                  courseForEn: "Parents teaching their children",
                  courseForAm: "ልጆቻቸውን የሚያስተምሩ ወላጆች",
                },
              ],
            },
          },
          ...(channelId ? { channelId } : {}),
          incomeRate: {
            createMany: {
              data: [
                { userId: seller.id, rate: 10 },
                { userId: affiliate.id, rate: 5 },
              ],
            },
          },
        },
      });
      createdCourses.push(course);
    }

    // Find Quran Memorization course (index 3 in the courses array)
    const quranMemorizationCourse =
      createdCourses.find(
        (c) => c.titleEn === "Quran Memorization - Surah Al-Fatiha to Al-Ma'un"
      ) || createdCourses[3];

    // Use the first course for activities (keeping existing activity structure)
    const course = createdCourses[0];

    // Create an activity with subActivities for quiz
    const activity = await prisma.activity.create({
      data: {
        titleEn: "Introduction to Math",
        titleAm: "የማትማት መግቢያ",
        courseId: course.id,
        order: 1,
        subActivity: {
          create: [
            {
              titleEn: "Addition Basics",
              titleAm: "የመደመር መሠረት",
              order: 1,
              video: "addition-basics.mp4",
              thumbnail: "https://example.com/thumb1.jpg",
            },
            {
              titleEn: "Subtraction Basics",
              titleAm: "የመቀነስ መሠረት",
              order: 2,
              video: "subtraction-basics.mp4",
              thumbnail: "https://example.com/thumb2.jpg",
            },
          ],
        },
      },
      include: { subActivity: true },
    });

    // Use the first subActivity for studentProgress
    const subActivity = activity.subActivity[0];

    // Create a quiz question
    const question = await prisma.question.create({
      data: {
        activityId: activity.id,
        question: "What is 2 + 2?",
        questionOptions: {
          create: [{ option: "3" }, { option: "4" }, { option: "5" }],
        },
      },
      include: { questionOptions: true },
    });

    // Create correct answer (option '4')
    const correctOption = question.questionOptions.find(
      (opt) => opt.option === "4"
    );
    await prisma.questionAnswer.create({
      data: {
        questionId: question.id,
        answerId: correctOption!.id,
      },
    });

    // Use the manager as the student for quiz/progress
    await prisma.studentQuiz.create({
      data: {
        userId: manager.id,
        questionId: question.id,
        studentQuizAnswers: {
          create: [
            {
              selectedOptionId: correctOption!.id,
            },
          ],
        },
      },
    });

    await prisma.studentProgress.create({
      data: {
        userId: manager.id,
        subActivityId: subActivity.id,
        isStarted: true,
        isCompleted: false,
      },
    });

    // Create a second activity with a quiz
    const activity2 = await prisma.activity.create({
      data: {
        titleEn: "Fractions",
        titleAm: "ፍራክሽኖች",
        courseId: course.id,
        order: 2,
        subActivity: {
          create: [
            {
              titleEn: "Fractions Basics",
              titleAm: "የፍራክሽን መሠረት",
              order: 1,
              video: "fractions-basics.mp4",
              thumbnail: "https://example.com/thumb3.jpg",
            },
          ],
        },
        question: {
          create: [
            {
              question: "Which value equals 1/2?",
              questionOptions: {
                create: [
                  { option: "0.25" },
                  { option: "0.5" },
                  { option: "2" },
                ],
              },
            },
          ],
        },
      },
      include: {
        question: { include: { questionOptions: true } },
        subActivity: true,
      },
    });

    // Mark the correct answer for the activity2 quiz (0.5)
    const activity2Question = activity2.question[0];
    const correctOption2 = activity2Question.questionOptions.find(
      (o) => o.option === "0.5"
    );
    if (correctOption2) {
      await prisma.questionAnswer.create({
        data: { questionId: activity2Question.id, answerId: correctOption2.id },
      });
    }

    // Create a Final Exam activity with multiple questions
    const finalExam = await prisma.activity.create({
      data: {
        titleEn: "Final Exam",
        titleAm: "መጨረሻ ፈተና",
        courseId: course.id,
        order: 99,
        question: {
          create: [
            {
              question: "What is 5 + 7?",
              questionOptions: {
                create: [{ option: "10" }, { option: "11" }, { option: "12" }],
              },
            },
            {
              question: "Which is greater?",
              questionOptions: {
                create: [
                  { option: "3/4" },
                  { option: "2/3" },
                  { option: "1/2" },
                ],
              },
            },
          ],
        },
      },
      include: { question: { include: { questionOptions: true } } },
    });

    // Set correct answers for the Final Exam
    const q1 = finalExam.question[0];
    const q1Correct = q1.questionOptions.find((o) => o.option === "12");
    if (q1Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: q1.id, answerId: q1Correct.id },
      });
    }

    const q2 = finalExam.question[1];
    const q2Correct = q2.questionOptions.find((o) => o.option === "3/4");
    if (q2Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: q2.id, answerId: q2Correct.id },
      });
    }

    // Optionally record a sample attempt for the manager on the final exam first question
    if (q1 && q1Correct) {
      await prisma.studentQuiz.create({
        data: {
          userId: manager.id,
          questionId: q1.id,
          studentQuizAnswers: {
            create: [{ selectedOptionId: q1Correct.id }],
          },
        },
      });
    }

    // ========== QURAN MEMORIZATION COURSE - QUIZZES AND FINAL EXAM ==========

    // Create activities with quizzes for Quran Memorization course
    const hifzActivity1 = await prisma.activity.create({
      data: {
        titleEn: "Surah Al-Fatiha Memorization",
        titleAm: "ሱራቱ አልፋቲሃ ሂፍዝ",
        courseId: quranMemorizationCourse.id,
        order: 1,
        subActivity: {
          create: [
            {
              titleEn: "Introduction to Surah Al-Fatiha",
              titleAm: "ሱራቱ አልፋቲሃ መግቢያ",
              order: 1,
              video: "fatiha-intro.mp4",
              thumbnail: "/thumbnails/fatiha-intro.jpg",
            },
            {
              titleEn: "Verse by Verse Memorization - Part 1",
              titleAm: "አንድ ለአንድ ሂፍዝ - ክፍል 1",
              order: 2,
              video: "fatiha-part1.mp4",
              thumbnail: "/thumbnails/fatiha-part1.jpg",
            },
            {
              titleEn: "Verse by Verse Memorization - Part 2",
              titleAm: "አንድ ለአንድ ሂፍዝ - ክፍል 2",
              order: 3,
              video: "fatiha-part2.mp4",
              thumbnail: "/thumbnails/fatiha-part2.jpg",
            },
          ],
        },
        question: {
          create: [
            {
              question:
                "How many verses are in Surah Al-Fatiha? (ሱራቱ አልፋቲሃ ስንት አያት አላት?)",
              answerExplanation:
                "Surah Al-Fatiha consists of 7 verses and is the opening chapter of the Quran.",
              questionOptions: {
                create: [
                  { option: "5 verses" },
                  { option: "6 verses" },
                  { option: "7 verses" },
                  { option: "8 verses" },
                ],
              },
            },
            {
              question:
                "What is the meaning of 'Al-Fatiha'? ('አልፋቲሃ' ማለት ምንድን ነው?)",
              answerExplanation:
                "Al-Fatiha means 'The Opening' - it opens the Quran.",
              questionOptions: {
                create: [
                  { option: "The Opening" },
                  { option: "The Light" },
                  { option: "The Guidance" },
                  { option: "The Mercy" },
                ],
              },
            },
            {
              question:
                "Which verse of Al-Fatiha asks for guidance? (የአልፋቲሃ የትኛው አያት ለመምራት ይጠይቃል?)",
              answerExplanation:
                "Verse 6 (Ihdina as-sirata al-mustaqim) asks Allah for guidance to the straight path.",
              questionOptions: {
                create: [
                  { option: "Verse 5" },
                  { option: "Verse 6" },
                  { option: "Verse 7" },
                  { option: "Verse 4" },
                ],
              },
            },
          ],
        },
      },
      include: {
        question: { include: { questionOptions: true } },
        subActivity: true,
      },
    });

    // Set correct answers for Activity 1 Quiz
    const hifzQ1 = hifzActivity1.question[0];
    const hifzQ1Correct = hifzQ1.questionOptions.find(
      (o) => o.option === "7 verses"
    );
    if (hifzQ1Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: hifzQ1.id, answerId: hifzQ1Correct.id },
      });
    }

    const hifzQ2 = hifzActivity1.question[1];
    const hifzQ2Correct = hifzQ2.questionOptions.find(
      (o) => o.option === "The Opening"
    );
    if (hifzQ2Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: hifzQ2.id, answerId: hifzQ2Correct.id },
      });
    }

    const hifzQ3 = hifzActivity1.question[2];
    const hifzQ3Correct = hifzQ3.questionOptions.find(
      (o) => o.option === "Verse 6"
    );
    if (hifzQ3Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: hifzQ3.id, answerId: hifzQ3Correct.id },
      });
    }

    // Create Activity 2 with Quiz
    const hifzActivity2 = await prisma.activity.create({
      data: {
        titleEn: "Surah Al-Ikhlas Memorization",
        titleAm: "ሱራቱ አልኢኽላስ ሂፍዝ",
        courseId: quranMemorizationCourse.id,
        order: 2,
        subActivity: {
          create: [
            {
              titleEn: "Introduction to Surah Al-Ikhlas",
              titleAm: "ሱራቱ አልኢኽላስ መግቢያ",
              order: 1,
              video: "ikhlas-intro.mp4",
              thumbnail: "/thumbnails/ikhlas-intro.jpg",
            },
            {
              titleEn: "Complete Memorization of Al-Ikhlas",
              titleAm: "አልኢኽላስን ሙሉ ሂፍዝ",
              order: 2,
              video: "ikhlas-complete.mp4",
              thumbnail: "/thumbnails/ikhlas-complete.jpg",
            },
          ],
        },
        question: {
          create: [
            {
              question:
                "How many verses are in Surah Al-Ikhlas? (ሱራቱ አልኢኽላስ ስንት አያት አላት?)",
              answerExplanation:
                "Surah Al-Ikhlas has 4 verses and is equivalent to one-third of the Quran.",
              questionOptions: {
                create: [
                  { option: "3 verses" },
                  { option: "4 verses" },
                  { option: "5 verses" },
                  { option: "6 verses" },
                ],
              },
            },
            {
              question:
                "What is the main theme of Surah Al-Ikhlas? (የአልኢኽላስ ዋና ርዕስ ምንድን ነው?)",
              answerExplanation:
                "Surah Al-Ikhlas emphasizes the Oneness and Unity of Allah (Tawheed).",
              questionOptions: {
                create: [
                  { option: "The Oneness of Allah" },
                  { option: "Prayer" },
                  { option: "Charity" },
                  { option: "Patience" },
                ],
              },
            },
          ],
        },
      },
      include: { question: { include: { questionOptions: true } } },
    });

    // Set correct answers for Activity 2 Quiz
    const hifzA2Q1 = hifzActivity2.question[0];
    const hifzA2Q1Correct = hifzA2Q1.questionOptions.find(
      (o) => o.option === "4 verses"
    );
    if (hifzA2Q1Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: hifzA2Q1.id, answerId: hifzA2Q1Correct.id },
      });
    }

    const hifzA2Q2 = hifzActivity2.question[1];
    const hifzA2Q2Correct = hifzA2Q2.questionOptions.find(
      (o) => o.option === "The Oneness of Allah"
    );
    if (hifzA2Q2Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: hifzA2Q2.id, answerId: hifzA2Q2Correct.id },
      });
    }

    // Create Final Exam for Quran Memorization Course
    const hifzFinalExam = await prisma.activity.create({
      data: {
        titleEn: "Final Exam - Quran Memorization",
        titleAm: "መጨረሻ ፈተና - የቁርአን ሂፍዝ",
        courseId: quranMemorizationCourse.id,
        order: 99,
        question: {
          create: [
            {
              question:
                "What is the first verse of Surah Al-Fatiha? (የሱራቱ አልፋቲሃ የመጀመሪያ አያት ምንድን ነው?)",
              answerExplanation:
                "The first verse is 'Bismillah ir-Rahman ir-Rahim' (In the name of Allah, the Most Gracious, the Most Merciful).",
              questionOptions: {
                create: [
                  { option: "Alhamdulillahi Rabbil Alameen" },
                  { option: "Bismillah ir-Rahman ir-Rahim" },
                  { option: "Ihdina as-sirata al-mustaqim" },
                  { option: "Maliki yawmi ad-deen" },
                ],
              },
            },
            {
              question:
                "How many Surahs are covered in this memorization course? (በዚህ የሂፍዝ ኮርስ ስንት ሱራቶች ይሸፍናሉ?)",
              answerExplanation:
                "This course covers the first 7 Surahs: Al-Fatiha, Al-Ikhlas, Al-Falaq, An-Nas, Al-Kafirun, An-Nasr, and Al-Ma'un.",
              questionOptions: {
                create: [
                  { option: "5 Surahs" },
                  { option: "6 Surahs" },
                  { option: "7 Surahs" },
                  { option: "8 Surahs" },
                ],
              },
            },
            {
              question:
                "What is the importance of memorizing Quran? (የቁርአን ሂፍዝ ጠቀሜታ ምንድን ነው?)",
              answerExplanation:
                "Memorizing Quran brings great rewards, spiritual benefits, and helps in daily prayers and worship.",
              questionOptions: {
                create: [
                  { option: "It is optional and not important" },
                  { option: "It brings great rewards and spiritual benefits" },
                  { option: "It is only for scholars" },
                  { option: "It has no benefits" },
                ],
              },
            },
            {
              question:
                "Which Surah is known as 'The Purity' or 'Sincerity'? (የትኛው ሱራት 'ንጹህነት' ወይም 'ንጹህ እምነት' ተብሎ ይጠራል?)",
              answerExplanation:
                "Surah Al-Ikhlas is also known as 'The Purity' or 'Sincerity' and emphasizes Tawheed.",
              questionOptions: {
                create: [
                  { option: "Al-Fatiha" },
                  { option: "Al-Ikhlas" },
                  { option: "Al-Falaq" },
                  { option: "An-Nas" },
                ],
              },
            },
            {
              question:
                "What is the best time to memorize Quran? (የቁርአን ሂፍዝ ምርጥ ጊዜ ምንድን ነው?)",
              answerExplanation:
                "Early morning after Fajr prayer is considered the best time for memorization as the mind is fresh.",
              questionOptions: {
                create: [
                  { option: "Late night" },
                  { option: "Early morning after Fajr" },
                  { option: "Afternoon" },
                  { option: "Any time is the same" },
                ],
              },
            },
            {
              question:
                "How should one revise memorized Surahs? (የተማሩ ሱራቶችን እንዴት መገምገም አለብን?)",
              answerExplanation:
                "Regular revision is essential - recite memorized Surahs in daily prayers and review them consistently.",
              questionOptions: {
                create: [
                  { option: "Never revise, just memorize new ones" },
                  {
                    option: "Revise regularly in prayers and daily recitation",
                  },
                  { option: "Revise only once a month" },
                  { option: "Revision is not necessary" },
                ],
              },
            },
          ],
        },
      },
      include: { question: { include: { questionOptions: true } } },
    });

    // Set correct answers for Final Exam
    const finalQ1 = hifzFinalExam.question[0];
    const finalQ1Correct = finalQ1.questionOptions.find(
      (o) => o.option === "Bismillah ir-Rahman ir-Rahim"
    );
    if (finalQ1Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: finalQ1.id, answerId: finalQ1Correct.id },
      });
    }

    const finalQ2 = hifzFinalExam.question[1];
    const finalQ2Correct = finalQ2.questionOptions.find(
      (o) => o.option === "7 Surahs"
    );
    if (finalQ2Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: finalQ2.id, answerId: finalQ2Correct.id },
      });
    }

    const finalQ3 = hifzFinalExam.question[2];
    const finalQ3Correct = finalQ3.questionOptions.find(
      (o) => o.option === "It brings great rewards and spiritual benefits"
    );
    if (finalQ3Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: finalQ3.id, answerId: finalQ3Correct.id },
      });
    }

    const finalQ4 = hifzFinalExam.question[3];
    const finalQ4Correct = finalQ4.questionOptions.find(
      (o) => o.option === "Al-Ikhlas"
    );
    if (finalQ4Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: finalQ4.id, answerId: finalQ4Correct.id },
      });
    }

    const finalQ5 = hifzFinalExam.question[4];
    const finalQ5Correct = finalQ5.questionOptions.find(
      (o) => o.option === "Early morning after Fajr"
    );
    if (finalQ5Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: finalQ5.id, answerId: finalQ5Correct.id },
      });
    }

    const finalQ6 = hifzFinalExam.question[5];
    const finalQ6Correct = finalQ6.questionOptions.find(
      (o) => o.option === "Revise regularly in prayers and daily recitation"
    );
    if (finalQ6Correct) {
      await prisma.questionAnswer.create({
        data: { questionId: finalQ6.id, answerId: finalQ6Correct.id },
      });
    }

    // Update Quran Memorization course with additional information
    await prisma.course.update({
      where: { id: quranMemorizationCourse.id },
      data: {
        aboutEn: `Comprehensive Quran Memorization course covering the first 7 Surahs: Al-Fatiha, Al-Ikhlas, Al-Falaq, An-Nas, Al-Kafirun, An-Nasr, and Al-Ma'un. This course includes:
        
- Step-by-step memorization techniques
- Proper pronunciation and Tajweed rules
- Understanding the meaning of each Surah
- Regular quizzes to test your progress
- Final exam to certify your memorization
- Tips for long-term retention
- Revision strategies

Perfect for beginners who want to start their Hifz journey with the most commonly recited Surahs.`,
        aboutAm: `የመጀመሪያ 7 ሱራቶችን የሚሸፍን የቁርአን ሂፍዝ ሙሉ ኮርስ: አልፋቲሃ፣ አልኢኽላስ፣ አልፋለቅ፣ አንናስ፣ አልካፊሩን፣ አንናስር፣ እና አልማዑን። ይህ ኮርስ ያካትታል:

- አንድ ለአንድ የሂፍዝ ቴክኒኮች
- ትክክለኛ ንባብ እና የተጅዊድ ህጎች
- የእያንዳንዱ ሱራት ትርጉም ማስተዋል
- የግምገማ ፈተናዎች
- የመጨረሻ ፈተና ለማረጋገጥ
- ለረጅም ጊዜ ለመቆየት ምክሮች
- የግምገማ ስትራቴጂዎች

ለጀማሪዎች በጣም ተደጋጋሚ ሱራቶችን በመጀመር የሂፍዝ ጉዞዎን ለመጀመር ተስማሚ።`,
        requirement: {
          deleteMany: {},
          createMany: {
            data: [
              {
                requirementEn:
                  "Basic knowledge of Arabic letters and pronunciation",
                requirementAm: "የአረብኛ ፊደላት እና ንባብ መሰረታዊ እውቀት",
              },
              {
                requirementEn: "Ability to read Quranic text (even if slowly)",
                requirementAm: "የቁርአን ጽሑፍን ማንበብ ችሎታ (ዝምታ ቢሆንም)",
              },
              {
                requirementEn:
                  "Dedication to daily practice (minimum 30 minutes)",
                requirementAm: "ወደ ዕለታዊ ልምምድ ቁርጠኝነት (ዝቅተኛ 30 ደቂቃ)",
              },
              {
                requirementEn:
                  "Commitment to complete the course and take the final exam",
                requirementAm: "ኮርሱን ለማጠናቀቅ እና የመጨረሻ ፈተና ለመውሰድ ቁርጠኝነት",
              },
              {
                requirementEn: "Regular revision of memorized Surahs",
                requirementAm: "የተማሩ ሱራቶችን መደበኛ ግምገማ",
              },
            ],
          },
        },
        courseFor: {
          deleteMany: {},
          createMany: {
            data: [
              {
                courseForEn:
                  "Beginners starting their Quran memorization journey",
                courseForAm: "የቁርአን ሂፍዝ ጉዞዎን የሚጀምሩ ጀማሪዎች",
              },
              {
                courseForEn:
                  "Muslims who want to memorize commonly recited Surahs for prayers",
                courseForAm: "ለጸሎት ተደጋጋሚ ሱራቶችን ለመማር የሚፈልጉ ሙስሊሞች",
              },
              {
                courseForEn:
                  "Parents teaching their children Quran memorization",
                courseForAm: "ልጆቻቸውን የቁርአን ሂፍዝ የሚያስተምሩ ወላጆች",
              },
              {
                courseForEn: "Students preparing for Quran competitions",
                courseForAm: "ለየቁርአን ውድድር የሚዘጋጁ ተማሪዎች",
              },
              {
                courseForEn:
                  "Anyone seeking spiritual growth through Quran memorization",
                courseForAm: "በቁርአን ሂፍዝ በኩል መንፈሳዊ እድገትን የሚፈልጉ ሁሉ",
              },
            ],
          },
        },
      },
    });

    console.log(
      "✅ Quran Memorization Course with Quizzes and Final Exam Created Successfully!"
    );

    // ========== ORDERS ==========
    // Create sample orders
    await prisma.order.create({
      data: {
        userId: manager.id,
        courseId: createdCourses[0].id,
        date: new Date(),
        status: "paid",
        totalPrice: 200,
        price: 200,
        paymentType: "chapa",
        currency: "ETB",
        instructorIncome: 180,
        tx_ref: "seed-order-001",
        img: "/receipts/receipt-001.jpg",
        reference: "REF-001",
        code: "CODE-001",
        income: 20,
        birrPrice: 1500,
        dolarPrice: 10,
      },
    });

    await prisma.order.create({
      data: {
        userId: manager.id,
        courseId: createdCourses[3].id, // Quran Memorization course
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: "paid",
        totalPrice: 500,
        price: 500,
        paymentType: "free",
        currency: "ETB",
        instructorIncome: 450,
        tx_ref: "seed-order-002",
        img: "/receipts/receipt-002.jpg",
        reference: "REF-002",
        birrPrice: 3000,
        dolarPrice: 25,
      },
    });

    // ========== TRANSFERS ==========
    // Create sample transfer records
    await prisma.transfer.create({
      data: {
        userId: instructor.id,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        income: 630, // Total from two orders: 180 + 450
        status: "unpaid",
      },
    });

    await prisma.transfer.create({
      data: {
        userId: seller.id,
        year: new Date().getFullYear() - 1,
        month: 12,
        income: 1000,
        status: "paid",
      },
    });

    // ========== VIDEO QUESTIONS & RESPONSES ==========
    // Create sample video questions from student
    const videoQuestion1 = await prisma.videoQuestion.create({
      data: {
        studentId: manager.id,
        courseId: createdCourses[0].id,
        question:
          "Can you explain more about the pronunciation of the letter 'ض' (Dad)?",
        timestamp: 1250, // 20 minutes 50 seconds
        type: "course",
      },
    });

    // Instructor responds to the question
    await prisma.videoResponse.create({
      data: {
        videoQuestionId: videoQuestion1.id,
        instructorId: instructor.id,
        response:
          "Great question! The letter 'ض' (Dad) is one of the heavy letters in Arabic. It's pronounced by placing the tip of the tongue against the upper front teeth, similar to 'd' but with more emphasis and vibration. Practice saying it slowly at first.",
      },
    });

    const videoQuestion2 = await prisma.videoQuestion.create({
      data: {
        studentId: manager.id,
        courseId: quranMemorizationCourse.id,
        question:
          "What's the best technique for memorizing longer verses without forgetting them?",
        timestamp: 3420, // 57 minutes
        type: "activity",
        subActivityId: hifzActivity1.subActivity[0]?.id,
      },
    });

    await prisma.videoResponse.create({
      data: {
        videoQuestionId: videoQuestion2.id,
        instructorId: instructor.id,
        response:
          "Excellent question! For longer verses, I recommend the 'chunking' method: break the verse into smaller parts (2-3 words), memorize each chunk, then connect them. Also, recite what you've memorized in your daily prayers to reinforce it. Regular revision is key!",
      },
    });

    // ========== ANNOUNCEMENTS ==========
    // Create course announcements
    await prisma.announcement.create({
      data: {
        courseId: createdCourses[0].id,
        anouncementDescription:
          "📢 Welcome to Basic Arabic Letters course! Please complete all activities in order to unlock the next lesson. Good luck!",
        attachLink: "https://example.com/welcome-resources",
      },
    });

    await prisma.announcement.create({
      data: {
        courseId: quranMemorizationCourse.id,
        anouncementDescription:
          "🎉 Congratulations to all students who completed the first Surah! The final exam will be available next week. Keep practicing!",
        attachLink: null,
      },
    });

    // ========== FEEDBACK ==========
    // Create course feedback/ratings
    await prisma.feedback.create({
      data: {
        userId: manager.id,
        courseId: createdCourses[0].id,
        feedback:
          "This course is excellent for beginners! The instructor explains everything clearly and the activities are very helpful.",
        rating: 5,
      },
    });

    await prisma.feedback.create({
      data: {
        userId: manager.id,
        courseId: quranMemorizationCourse.id,
        feedback:
          "Great memorization course! The step-by-step approach makes it easy to learn. Highly recommended for anyone starting their Hifz journey.",
        rating: 5,
      },
    });

    // ========== PUBLIC ANNOUNCEMENTS ==========
    // Create public announcements
    await prisma.publicAnnouncement.create({
      data: {
        message:
          "🌟 New Course Available! Check out our latest course on Advanced Tajweed. Enroll now and get 20% off!",
        photo: "/announcements/new-course-banner.jpg",
      },
    });

    await prisma.publicAnnouncement.create({
      data: {
        message:
          "📚 Ramadan Special: All courses are now available with special discounts. Enhance your knowledge this holy month!",
        photo: "/announcements/ramadan-special.jpg",
      },
    });

    // ========== PERIODIC DISCOUNTS ==========
    // Create periodic discount for courses
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await prisma.periodicDiscount.create({
      data: {
        courseId: createdCourses[0].id,
        discountRate: 15,
        startDate: new Date(),
        endDate: nextMonth,
      },
    });

    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

    await prisma.periodicDiscount.create({
      data: {
        courseId: createdCourses[3].id, // Quran Memorization course
        discountRate: 20,
        startDate: new Date(),
        endDate: twoMonthsLater,
      },
    });

    console.log(
      "✅ Additional Seed Data (Orders, Transfers, Video Q&A, Announcements, Feedback, Discounts) Created Successfully!"
    );
    console.log("SEED SUCCESS");
  } catch (error) {
    console.log("SEED ERROR :: ", error);
  } finally {
    await prisma.$disconnect();
  }
})();
