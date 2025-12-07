import React, { useRef } from "react";
import "daisyui/dist/full.css";
import { FaGithub, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const CreativeTemplate = ({ data, theme }) => {
    const resumeRef = useRef(null);

    const handleDownloadPdf = () => {
        toPng(resumeRef.current, { quality: 1.0 })
            .then((dataUrl) => {
                const pdf = new jsPDF("p", "mm", "a4");
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${data.personalInformation.fullName}_creative.pdf`);
            })
            .catch((err) => {
                console.error("Error generating PDF", err);
            });
    };

    return (
        <div className="flex flex-col items-center font-sans">
            <div
                ref={resumeRef}
                className="w-[210mm] min-h-[297mm] flex shadow-2xl bg-white text-black transition-all duration-300 animate-fade-in print:shadow-none print:w-full print:flex"
                style={{ backgroundColor: '#ffffff', color: '#333' }}
            >
                {/* Left Sidebar */}
                <div className="w-1/3 bg-gray-900 text-white p-6 flex flex-col justify-between" style={{ minHeight: '297mm' }}>
                    <div>
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold border-2 border-white">
                                {data.personalInformation.fullName ? data.personalInformation.fullName.charAt(0) : 'U'}
                            </div>
                            <h1 className="text-2xl font-bold text-center leading-tight">
                                {data.personalInformation.fullName}
                            </h1>
                            <p className="text-center text-gray-400 text-sm mt-2">{data.personalInformation.location}</p>
                        </div>

                        <div className="space-y-4 text-sm">
                            {data.personalInformation.email && (
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FaEnvelope className="text-accent min-w-[16px]" />
                                    <span className="truncate">{data.personalInformation.email}</span>
                                </div>
                            )}
                            {data.personalInformation.phoneNumber && (
                                <div className="flex items-center gap-2">
                                    <FaPhone className="text-accent min-w-[16px]" />
                                    <span>{data.personalInformation.phoneNumber}</span>
                                </div>
                            )}
                            {data.personalInformation.linkedIn && (
                                <div className="flex items-center gap-2">
                                    <FaLinkedin className="text-accent min-w-[16px]" />
                                    <a href={data.personalInformation.linkedIn} className="hover:text-accent truncate">LinkedIn</a>
                                </div>
                            )}
                            {data.personalInformation.gitHub && (
                                <div className="flex items-center gap-2">
                                    <FaGithub className="text-accent min-w-[16px]" />
                                    <a href={data.personalInformation.gitHub} className="hover:text-accent truncate">GitHub</a>
                                </div>
                            )}
                        </div>

                        {data.skills && data.skills.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-bold border-b border-gray-600 pb-1 mb-3 text-accent">SKILLS</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.map((skill, index) => (
                                        <span key={index} className="bg-gray-700 text-xs px-2 py-1 rounded">
                                            {typeof skill === 'string' ? skill : skill.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.languages && data.languages.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-bold border-b border-gray-600 pb-1 mb-3 text-accent">LANGUAGES</h3>
                                <ul className="list-disc list-inside text-sm">
                                    {data.languages.map((lang, index) => (
                                        <li key={index}>{lang.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 text-center mt-4">
                        Generated by ResumeAI
                    </div>
                </div>

                {/* Right Content */}
                <div className="w-2/3 p-8">
                    {data.summary && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 mb-3">Profile</h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {data.summary}
                            </p>
                        </div>
                    )}

                    {data.experience && data.experience.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 mb-4">Experience</h2>
                            <div className="space-y-5">
                                {data.experience.map((exp, index) => (
                                    <div key={index} className="relative pl-4 border-l-2 border-gray-300">
                                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-400"></div>
                                        <h3 className="font-bold text-lg text-gray-800">{exp.jobTitle}</h3>
                                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                                            <span className="font-semibold text-accent">{exp.company}</span>
                                            <span>{exp.duration}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {exp.responsibility}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.education && data.education.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 mb-4">Education</h2>
                            <div className="space-y-4">
                                {data.education.map((edu, index) => (
                                    <div key={index}>
                                        <h3 className="font-bold text-gray-800">{edu.degree}</h3>
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>{edu.university}</span>
                                            <span>{edu.graduationYear}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.projects && data.projects.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 mb-4">Projects</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {data.projects.map((proj, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded shadow-sm">
                                        <h3 className="font-bold text-sm">{proj.title}</h3>
                                        <p className="text-xs text-gray-600 mt-1">{proj.description}</p>
                                        <div className="text-xs text-gray-400 mt-2">
                                            {proj.technologiesUsed}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <section className="flex justify-center mt-8 mb-12">
                <div
                    onClick={handleDownloadPdf}
                    className="btn btn-neutral btn-wide hover:scale-105 transition-transform duration-200"
                >
                    Download Creative PDF
                </div>
            </section>
        </div>
    );
};

export default CreativeTemplate;
