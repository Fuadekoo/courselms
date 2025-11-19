import { z } from "zod";

export const userSchema = z.object({
  id: z.string({ message: "" }).optional(),
  firstName: z.string({ message: "" }).nonempty("First Name is required"),
  fatherName: z.string({ message: "" }).nonempty("Father Name is required"),
  lastName: z.string({ message: "" }).nonempty("Last Name is required"),
  phoneNumber: z
    .string({ message: "" })
    .length(10, "Must be 10 digits")
    .regex(/^\d+$/, "Must contain only digits")
    .startsWith("0", "Must start with 0"),
  age: z
    .string({ message: "" })
    .length(2, "Must be 2 digits")
    .regex(/^\d+$/, "Must contain only digits"),
  gender: z.enum(["Male", "Female"], { message: "Must have Female or Male" }),
  country: z.string({ message: "" }).nonempty("Country is required"),
  region: z.string({ message: "" }).nonempty("Region is required"),
  city: z.string({ message: "" }).nonempty("City is required"),
  password: z.string({ message: "" }).optional(),
});

export const managerSchema = userSchema;
export const affiliateSchema = userSchema;
export const affiliateSchemaSelf = z.intersection(
  affiliateSchema,
  z.object({
    idCard: z
      .string({ message: "Name must be string" })
      .nonempty("ID image is required"),
    code: z
      .string({ message: "" })
      .length(4, "Must be 4 digits")
      .regex(/^\d+$/, "Must contain only digits"),
    password: z.string({ message: "" }).nonempty("Password is required"),
  })
);
export const sellerSchema = userSchema;
export const studentSchema = userSchema;

export const courseSchema = z.object({
  id: z.optional(z.string({ message: "" }).nonempty("")),
  titleEn: z.string({ message: "" }).nonempty("title is required"),
  titleAm: z.string({ message: "" }).nonempty("title is required"),
  aboutEn: z.string({ message: "" }).nonempty("about is required"),
  aboutAm: z.string({ message: "" }).nonempty("about is required"),
  thumbnail: z.string({ message: "" }).nonempty("thumbnail is required"),
  video: z.string({ message: "" }).nonempty("video is required"),
  pdf: z.string({ message: "" }).optional(), // Optional PDF field
  aiProvider: z.string().optional(), // Optional AI provider field (gemini or openai)
  courseMaterials: z
    .array(
      z.object({
        name: z.string({ message: "" }),
        url: z.string({ message: "" }),
        type: z.string({ message: "" }),
      })
    )
    .optional(),
  price: z.coerce.number({ message: "" }).gt(0, "price must be greater than 0"),
  dolarPrice: z.coerce
    .number({ message: "" })
    .gt(0, "dollar price must be greater than 0"),
  birrPrice: z.coerce
    .number({ message: "" })
    .gt(0, "birr price must be greater than 0"),
  level: z.enum(["beginner", "intermediate", "advanced"], { message: "" }),
  language: z.string({ message: "" }).nonempty("language is required"),
  duration: z.string({ message: "" }).time("duration must be time 00:00"),
  accessEn: z.string({ message: "" }).nonempty("access is required"),
  accessAm: z.string({ message: "" }).nonempty("access is required"),
  certificate: z.coerce.boolean({
    message: "certificate must be true or false",
  }),
  instructorRate: z.coerce
    .number({ message: "" })
    .gt(0, "instructor rate must be greater than 0"),
  sellerRate: z.coerce
    .number({ message: "" })
    .gt(0, "seller rate must be greater than 0"),
  affiliateRate: z.coerce
    .number({ message: "" })
    .gt(0, "affiliate rate must be greater than 0"),
  requirement: z.array(
    z.object({
      requirementEn: z
        .string({ message: "" })
        .nonempty("requirement is required"),
      requirementAm: z
        .string({ message: "" })
        .nonempty("requirement is required"),
    })
  ),
  courseFor: z.array(
    z.object({
      courseForEn: z.string({ message: "" }).nonempty("course for is required"),
      courseForAm: z.string({ message: "" }).nonempty("course for is required"),
    })
  ),
  activity: z.array(
    z.object({
      titleEn: z.string({ message: "" }).nonempty("activity title is required"),
      titleAm: z.string({ message: "" }).nonempty("activity title is required"),
      subActivity: z.array(
        z.object({
          titleEn: z
            .string({ message: "" })
            .nonempty("sub activity title is required"),
          titleAm: z
            .string({ message: "" })
            .nonempty("sub activity title is required"),
          video: z.string({ message: "" }).optional(),
          thumbnail: z.string({ message: "" }).optional(),
        })
      ),
      questions: z
        .array(
          z.object({
            question: z
              .string({ message: "" })
              .nonempty("question is required"),
            options: z.array(z.string()).min(2, "at least 2 options required"),
            answers: z.array(z.string()).min(1, "at least 1 answer required"),
            explanation: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
  // .nonempty("activity is required"),
  instructorId: z.string({ message: "" }).nonempty("instructor is required"),
  channelId: z.string({ message: "" }).nonempty("channel is required"),
  finalExamQuestions: z
    .array(
      z.object({
        question: z.string({ message: "" }).nonempty("question is required"),
        options: z.array(z.string()).min(2, "at least 2 options required"),
        answers: z.array(z.string()).min(1, "at least 1 answer required"),
        explanation: z.string().optional(),
        sourceActivityIndex: z.number().optional(),
        sourceQuestionIndex: z.number().optional(),
        isSharedFromActivity: z.boolean().optional(),
      })
    )
    .optional(),
});
