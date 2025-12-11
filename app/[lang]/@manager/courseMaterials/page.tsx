import { getCourses } from "@/actions/manager/course-materials";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CourseMaterialsPage() {
  try {
    const result = await getCourses();
    
    if (!result.success) {
      return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-600 text-lg font-semibold mb-2">
                  Failed to load course packages
                </div>
                <div className="text-red-500 text-sm">
                  {result.message || "Unknown error occurred"}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const courseList = result.data || [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Course Materials</h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1">
                      Upload and manage course materials including PDFs, presentations, documents, and other resources.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
                {courseList.length > 0 ? (
                  <div className="bg-white/70 backdrop-blur-sm shadow-sm border-0 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-4">
                      {courseList.length} course package(s) found. Course materials management will be available soon.
                    </p>
                    <div className="space-y-2">
                      {courseList.map((pkg) => (
                        <div key={pkg.id} className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{pkg.titleEn}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/70 backdrop-blur-sm shadow-sm border-0 rounded-lg p-16 flex flex-col items-center justify-center">
                    <div className="rounded-full bg-slate-100 p-6 mb-4">
                      <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No Course Packages Found</h3>
                    <p className="text-slate-600 text-center max-w-md">
                      Create course packages first to upload and manage course materials.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Unexpected error in CourseMaterialsPage:", error);
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-2">
                Unexpected error occurred
              </div>
              <div className="text-red-500 text-sm">
                Please try refreshing the page
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}