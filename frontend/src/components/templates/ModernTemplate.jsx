import React, { useRef } from "react";
import "daisyui/dist/full.css";
import { FaGithub, FaLinkedin, FaPhone, FaEnvelope } from "react-icons/fa";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const ModernTemplate = ({ data, theme }) => {
    const resumeRef = useRef(null);

    const handleDownloadPdf = () => {
        toPng(resumeRef.current, { quality: 1.0 })
            .then((dataUrl) => {
                const pdf = new jsPDF("p", "mm", "a4");
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${data.personalInformation.fullName}.pdf`);
            })
            .catch((err) => {
                console.error("Error generating PDF", err);
            });
    };

    return (
        <div className="flex flex-col items-center">
            <div
                ref={resumeRef}
                className="w-[210mm] min-h-[297mm] shadow-2xl rounded-lg p-8 space-y-6 bg-base-100 text-base-content border border-gray-200 dark:border-gray-700 transition-all duration-300 animate-fade-in print:shadow-none print:w-full print:border-none"
                style={{ backgroundColor: theme === 'dark' ? '#1d232a' : '#ffffff', color: theme === 'dark' ? '#a6adbb' : '#1f2937' }}
            >
                {/* Header Section */}
                <div className="text-center space-y-2 animate-fade-in-up">
                    <h1 className="text-4xl font-bold text-primary transition-transform duration-300 hover:scale-105">
                        {data.personalInformation.fullName}
                    </h1>
                    <p className="text-lg text-gray-500">{data.personalInformation.location}</p>

                    <div className="flex justify-center flex-wrap gap-4 mt-2">
                        {data.personalInformation.email && (
                            <a
                                href={`mailto:${data.personalInformation.email}`}
                                className="flex items-center text-secondary hover:underline hover:text-accent transition-all duration-200"
                            >
                                <FaEnvelope className="mr-2" /> {data.personalInformation.email}
                            </a>
                        )}
                        {data.personalInformation.phoneNumber && (
                            <p className="flex items-center text-gray-500">
                                <FaPhone className="mr-2" /> {data.personalInformation.phoneNumber}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center space-x-4 mt-2">
                        {data.personalInformation.gitHub && (
                            <a
                                href={data.personalInformation.gitHub}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-gray-700 flex items-center transition-transform hover:scale-105"
                            >
                                <FaGithub className="mr-2" /> GitHub
                            </a>
                        )}
                        {data.personalInformation.linkedIn && (
                            <a
                                href={data.personalInformation.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 flex items-center transition-transform hover:scale-105"
                            >
                                <FaLinkedin className="mr-2" /> LinkedIn
                            </a>
                        )}
                    </div>
                </div>

                <div className="divider"></div>

                {/* Summary Section */}
                <div className="space-y-2 animate-slide-in-left">
                    <h2 className="text-2xl font-semibold text-secondary border-b-2 border-secondary pb-1">
                        Summary
                    </h2>
                    <p className="text-base leading-relaxed text-justify opacity-90">
                        {data.summary}
                    </p>
                </div>

                {/* Skills Section */}
                {data.skills && data.skills.length > 0 && (
                    <div className="space-y-4 animate-slide-in-right">
                        <h2 className="text-2xl font-semibold text-accent border-b-2 border-accent pb-1">
                            Skills
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {data.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="badge badge-outline badge-lg p-3 hover:bg-accent hover:text-white transition-all duration-300 hover:scale-110 cursor-default"
                                >
                                    {skill.title || skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Experience Section */}
                {data.experience && data.experience.length > 0 && (
                    <div className="space-y-6 animate-slide-in-left">
                        <h2 className="text-2xl font-semibold text-primary border-b-2 border-primary pb-1">
                            Experience
                        </h2>
                        {data.experience.map((exp, index) => (
                            <div
                                key={index}
                                className="border-l-4 border-primary pl-4 hover:bg-base-200 p-2 rounded-r-lg transition-all duration-300 hover:translate-x-2"
                            >
                                <h3 className="text-xl font-bold flex flex-wrap justify-between">
                                    <span>{exp.jobTitle}</span>
                                    <span className="text-sm font-normal text-gray-500 bg-base-300 px-2 py-1 rounded">
                                        {exp.duration}
                                    </span>
                                </h3>
                                <p className="text-lg font-medium text-gray-600 italic">
                                    {exp.company}
                                </p>
                                <p className="text-sm text-gray-400 mb-2">{exp.location}</p>
                                <ul className="list-disc list-inside space-y-1 opacity-90">
                                    {exp.responsibility && exp.responsibility.split('.').filter(r => r.trim()).map((resp, idx) => (
                                        <li key={idx} className="hover:text-primary transition-colors">{resp.trim()}.</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}

                {/* Education Section */}
                {data.education && data.education.length > 0 && (
                    <div className="space-y-6 animate-slide-in-right">
                        <h2 className="text-2xl font-semibold text-secondary border-b-2 border-secondary pb-1">
                            Education
                        </h2>
                        {data.education.map((edu, index) => (
                            <div
                                key={index}
                                className="flex flex-wrap justify-between items-start hover:bg-base-200 p-3 rounded-lg transition-all duration-200"
                            >
                                <div>
                                    <h3 className="text-xl font-bold">{edu.degree}</h3>
                                    <p className="text-lg text-gray-600">{edu.university}</p>
                                </div>
                                <div className="text-right">
                                    <span className="badge badge-secondary">{edu.graduationYear}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Projects Section */}
                {data.projects && data.projects.length > 0 && (
                    <div className="space-y-4 animate-slide-in-left">
                        <h2 className="text-2xl font-semibold text-accent border-b-2 border-accent pb-1">
                            Projects
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {data.projects.map((project, index) => (
                                <div key={index} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all">
                                    <div className="card-body p-4">
                                        <h3 className="card-title text-lg flex justify-between">
                                            {project.title}
                                            {project.githubLink && (
                                                <a href={project.githubLink} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">Code</a>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600">{project.description}</p>
                                        <div className="card-actions justify-end mt-2">
                                            {project.technologiesUsed && project.technologiesUsed.split(',').map((tech, i) => (
                                                <span key={i} className="badge badge-xs badge-outline">{tech.trim()}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            <section className="flex justify-center mt-8 mb-12">
                <div
                    onClick={handleDownloadPdf}
                    className="btn btn-primary btn-lg hover:scale-105 transition-transform duration-200 shadow-xl"
                >
                    Download PDF
                </div>
            </section>

            {/* Styles for animation and print */}
            <style jsx global>{`
          /* PDF / Print Styles */
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:w-full, .print\\:w-full * {
                visibility: visible;
            }
             .print\\:w-full {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                box-shadow: none;
                border: none;
             }
             /* Hide buttons when printing */
             .btn, .navbar, footer {
                 display: none !important;
             }
          }

          .animate-fade-in { animation: fadeIn 0.8s ease-in-out; }
          .animate-fade-in-up { animation: fadeInUp 0.6s ease-in-out; }
          .animate-slide-in-left { animation: slideInLeft 0.5s ease-out; }
          .animate-slide-in-right { animation: slideInRight 0.5s ease-out; }

          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>
        </div>
    );
};

export default ModernTemplate;
