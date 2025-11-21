import prisma from "@/lib/db";

(async () => {
  try {
    // Create users (or update if they exist)
    const manager = await prisma.user.upsert({
      where: { phoneNumber: "0945467891" },
      update: {},
      create: {
        role: "manager",
        firstName: "abdelkerim",
        fatherName: "ahmed",
        lastName: "mohammed",
        phoneNumber: "0945467891",
        password:
          "$2a$12$Wt8Q9Q23DmCEiVPucCrTcOTxtYRkNUhK5MoyaJotYBc1RbJdUbk0W",
        permission: {
          create: { permission: "manager" },
        },
      },
    });
    await prisma.user.upsert({
      where: { phoneNumber: "0942303571" },
      update: {},
      create: {
        role: "student",
        firstName: "mubarek",
        fatherName: "ahmed",
        lastName: "mohammed",
        phoneNumber: "0942303571",
        password:
          "$2a$12$Wt8Q9Q23DmCEiVPucCrTcOTxtYRkNUhK5MoyaJotYBc1RbJdUbk0W",
        status: "active",
      },
    });

    const instructor = await prisma.user.upsert({
      where: { phoneNumber: "0910203040" },
      update: {},
      create: {
        role: "instructor",
        firstName: "Fuad",
        fatherName: "Abdurahaman",
        lastName: "Kalid",
        phoneNumber: "0910203040",
        password:
          "$2a$12$MdcOCCZBmPTAfKFbke.ObOT9gED00eqsdQEfttlrQixjmjJMWR/wW",
        status: "active",
      },
    });

    const seller = await prisma.user.upsert({
      where: { phoneNumber: "0945467893" },
      update: {},
      create: {
        role: "seller",
        firstName: "abubeker",
        fatherName: "ahmed",
        lastName: "mohammed",
        phoneNumber: "0945467893",
        password:
          "$2a$12$MdcOCCZBmPTAfKFbke.ObOT9gED00eqsdQEfttlrQixjmjJMWR/wW",
        status: "active",
      },
    });

    const affiliate = await prisma.user.upsert({
      where: { phoneNumber: "0933807447" },
      update: {},
      create: {
        role: "affiliate",
        firstName: "ahmed",
        fatherName: "ahmed",
        lastName: "mohammed",
        phoneNumber: "0933807447",
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
          video:
            "https://www.youtube.com/embed/tak7aLltLuU?si=pF6IhoZmLLjZdFjF&amp;controls=0",
          price: courseData.price,
          birrPrice: courseData.birrPrice,
          dolarPrice: courseData.dolarPrice,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          level: courseData.level as any,
          language: courseData.language,
          duration: courseData.duration,
          certificate: courseData.certificate,
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
              video: "https://example.com/video1.mp4",
              thumbnail: "https://example.com/thumb1.jpg",
            },
            {
              titleEn: "Subtraction Basics",
              titleAm: "የመቀነስ መሠረት",
              order: 2,
              video: "https://example.com/video2.mp4",
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
              video: "https://example.com/video3.mp4",
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

    console.log("SEED SUCCESS");
  } catch (error) {
    console.log("SEED ERROR :: ", error);
  } finally {
    await prisma.$disconnect();
  }
})();
