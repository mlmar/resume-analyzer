export const ANALYZE_MODEL = "gpt-4o-mini";

export const matchSchema = {
    type: "object",
    properties: {
        matchingSkills: {
            type: "array",
            items: { type: "string" },
            description: "Technical skills, technologies, tools, and qualifications from the job description that are explicitly present on the resume, PLUS experience/tenure requirements (e.g. '3+ years of X') that the candidate's work history clearly satisfies. Do NOT infer specific skills or technologies not explicitly listed on the resume. Do NOT include soft skills (e.g. communication, collaboration, problem-solving). Use the job description's phrasing. Order by relevance to the role."
        },
        missingSkills: {
            type: "array",
            items: { type: "string" },
            description: "Technical skills, technologies, tools, and qualifications from the job description that are NOT explicitly listed on the resume, plus experience/tenure requirements the candidate's work history does not satisfy. Do NOT include soft skills (e.g. communication, collaboration, problem-solving). Use the job description's phrasing. Order by importance to the role."
        },
        level: {
            type: "string",
            description: "Candidate's inferred seniority level based on resume experience (e.g. Junior, Mid, Senior, Staff, Principal)"
        },
        salary: {
            type: "string",
            description: "Candidate's estimated competitive annual salary range in USD (e.g. '$120,000 - $150,000') based on this role's level, location, and role market rates"
        },
        matchScore: {
            type: "number",
            description: "A 0-100 match score where required skills are weighted more heavily than preferred skills; 80+ indicates the candidate meets most requirements"
        },
        summary: {
            type: "string",
            description: "2-4 sentence overview of the candidate's fit, key strengths relative to the role, and critical gaps"
        }
    },
    required: ["matchingSkills", "missingSkills", "level", "salary", "matchScore", "summary"],
    additionalProperties: false
};

export function buildPrompt(resume: string, job: string) {
    return [
        `You are a technical recruiter and hiring expert. Analyze how well the candidate's resume matches the job description.`,
        `Instructions:`,
        `- Extract concrete skills, technologies, tools, certifications, and qualifications from both documents.`,
        `- matchingSkills: Skills and technologies explicitly listed on the resume that also appear in the job description, plus any experience/tenure requirements (e.g. "3+ years of X") that the candidate's work history clearly satisfies. Do NOT infer specific skills or technologies that are not explicitly stated on the resume. Use the exact phrasing from the job description. Order by relevance to the role.`,
        `- missingSkills: Skills and technologies required or preferred in the job description that are NOT explicitly listed on the resume, plus any experience/tenure requirements the candidate does not satisfy. Use the exact phrasing from the job description. Order by importance to the role.`,
        `- Do NOT include soft skills (e.g. "communication", "teamwork", "collaboration", "problem-solving", "leadership") in either list under any circumstances.`,
        `- level: Infer the candidate's seniority from their resume (e.g. "Junior", "Mid", "Senior", "Staff", "Principal"). Base this on years of experience, scope of past roles, and technical depth.`,
        `- salary: Estimate a competitive annual salary range in USD (e.g. "$120,000 - $150,000") based on the inferred level, location if mentioned, and market rates for the role.`,
        `- matchScore: A 0-100 score. Weight required skills more heavily than preferred/nice-to-have skills. A score of 70+ means the candidate meets most requirements.`,
        `- summary: 2-4 sentences covering the candidate's fit, key strengths relative to the role, and the most critical gaps.`,
        `<Resume>\n${resume}\n</Resume>`,
        `<Job Description>\n${job}\n</Job Description>`
    ].join('\n');
}
