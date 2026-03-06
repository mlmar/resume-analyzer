export const ANALYZE_MODEL = "gpt-4o-mini";

export const matchSchema = {
    type: "object",
    properties: {
        matchingSkills: {
            type: "array",
            items: { type: "string" },
            description: "Skills, technologies, and qualifications found in both the resume and job description, using the job description's phrasing, ordered by relevance to the role"
        },
        missingSkills: {
            type: "array",
            items: { type: "string" },
            description: "Skills, technologies, and qualifications required or preferred in the job description but absent from the resume, ordered by importance to the role"
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
            description: "A 0-100 match score where required skills are weighted more heavily than preferred skills; 70+ indicates the candidate meets most requirements"
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
        `- matchingSkills: Skills/technologies present in BOTH the resume and job description. Use the exact phrasing from the job description. Order by relevance to the role.`,
        `- missingSkills: Skills/technologies required or preferred in the job description but NOT evidenced in the resume. Order by importance to the role.`,
        `- Do NOT include soft skills (e.g. "communication", "teamwork") unless they are a core job requirement.`,
        `- level: Infer the candidate's seniority from their resume (e.g. "Junior", "Mid", "Senior", "Staff", "Principal"). Base this on years of experience, scope of past roles, and technical depth.`,
        `- salary: Estimate a competitive annual salary range in USD (e.g. "$120,000 - $150,000") based on the inferred level, location if mentioned, and market rates for the role.`,
        `- matchScore: A 0-100 score. Weight required skills more heavily than preferred/nice-to-have skills. A score of 70+ means the candidate meets most requirements.`,
        `- summary: 2-4 sentences covering the candidate's fit, key strengths relative to the role, and the most critical gaps.`,
        `<Resume>\n${resume}\n</Resume>`,
        `<Job Description>\n${job}\n</Job Description>`
    ].join('\n');
}
