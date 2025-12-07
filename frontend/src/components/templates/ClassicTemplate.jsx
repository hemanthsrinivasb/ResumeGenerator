import React, { useRef } from "react";
import "daisyui/dist/full.css";
import { FaGithub, FaLinkedin, FaPhone, FaEnvelope } from "react-icons/fa";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const ClassicTemplate = ({ data, theme }) => {
    const resumeRef = useRef(null);

    const handleDownloadPdf = () => {
        toPng(resumeRef.current, { quality: 1.0 })
            .then((dataUrl) => {
                const pdf = new jsPDF("p", "mm", "a4");
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${data.personalInformation.fullName}_classic.pdf`);
            })
            .catch((err) => {
                console.error("Error generating PDF", err);
            });
    };

    return (
        <div className="flex flex-col items-center font-serif">
            <div
                ref={resumeRef}
                className="w-[210mm] min-h-[297mm] shadow-2xl bg-white text-black p-12 transition-all duration-300 animate-fade-in print:shadow-none print:w-full"
                style={{ color: '#000000', backgroundColor: '#ffffff' }}
            >
                {/* Header - Left Aligned for Classic Look */}
                <div className="border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-4xl font-bold uppercase tracking-wide mb-2">
                        {data.personalInformation.fullName}
                    </h1>
                    <div className="text-sm flex flex-wrap gap-4 text-gray-800">
                        <span>{data.personalInformation.location}</span>
                        {data.personalInformation.email && (
                            <span className="flex items-center gap-1">
                                <FaEnvelope size={12} /> {data.personalInformation.email}
                            </span>
                        )}
                        {data.personalInformation.phoneNumber && (
                            <span className="flex items-center gap-1">
                                <FaPhone size={12} /> {data.personalInformation.phoneNumber}
                            </span>
                        )}
                        {data.personalInformation.linkedIn && (
                            <span className="flex items-center gap-1">
                                <FaLinkedin size={12} /> LinkedIn
                            </span>
                        )}
                        {data.personalInformation.gitHub && (
                            <span className="flex items-center gap-1">
                                <FaGithub size={12} /> GitHub
                            </span>
                        )}
                    </div>
                </div>

                {/* Summary */}
                {data.summary && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Professional Summary</h2>
                        <p className="text-sm leading-relaxed text-justify">
                            {data.summary}
                        </p>
                    </div>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Experience</h2>
                        <div className="space-y-4">
                            {data.experience.map((exp, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-baseline font-bold">
                                        <h3 className="text-md">{exp.company}</h3>
                                        <span className="text-sm">{exp.duration}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="italic text-sm">{exp.jobTitle}</span>
                                        <span className="text-sm text-gray-600">{exp.location}</span>
                                    </div>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        {exp.responsibility && exp.responsibility.split('.').filter(r => r.trim()).map((resp, idx) => (
                                            <li key={idx}>{resp.trim()}.</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Projects</h2>
                        <div className="space-y-3">
                            {data.projects.map((project, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-baseline font-bold">
                                        <span className="text-md">{project.title}</span>
                                        {project.githubLink && (
                                            <a href={project.githubLink} className="text-xs text-blue-800 underline">View Code</a>
                                        )}
                                    </div>
                                    <p className="text-sm mb-1">{project.description}</p>
                                    <p className="text-xs text-gray-600">
                                        <strong>Tech:</strong> {project.technologiesUsed}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Education</h2>
                        {data.education.map((edu, index) => (
                            <div key={index} className="flex justify-between items-baseline mb-2">
                                <div>
                                    <h3 className="font-bold text-md">{edu.university}</h3>
                                    <p className="italic text-sm">{edu.degree}</p>
                                </div>
                                <div className="text-right text-sm">
                                    <span className="block font-bold">{edu.graduationYear}</span>
                                    <span className="block text-gray-600">{edu.location}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Skills</h2>
                        <p className="text-sm leading-relaxed">
                            {data.skills.map((skill) => (typeof skill === 'string' ? skill : skill.title)).join(" • ")}
                        </p>
                    </div>
                )}
            </div>

            <section className="flex justify-center mt-8 mb-12">
                <div
                    onClick={handleDownloadPdf}
                    className="btn btn-neutral btn-outline btn-lg hover:scale-105 transition-transform duration-200"
                >
                    Download Classic PDF
                </div>
            </section>
        </div>
    );
};

export default ClassicTemplate;
