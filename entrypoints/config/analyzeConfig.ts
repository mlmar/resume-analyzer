export const ANALYZE_MODEL = "gpt-4o-mini";

export const matchSchema = {
    type: "object",
    properties: {
        matchingSkills: {
            type: "array",
            items: { type: "string" },
            description: "Technical skills, technologies, tools, and qualifications from the job description that are explicitly present on my resume, PLUS experience/tenure requirements (e.g. '3+ years of X') that my work history clearly satisfies. Do NOT infer specific skills or technologies not explicitly listed on my resume. Do NOT include soft skills (e.g. communication, collaboration, problem-solving). Use the job description's phrasing. Order by relevance to the role."
        },
        missingSkills: {
            type: "array",
            items: { type: "string" },
            description: "Technical skills, technologies, tools, and qualifications from the job description that are NOT explicitly listed on my resume, plus experience/tenure requirements my work history does not satisfy. Do NOT include soft skills (e.g. communication, collaboration, problem-solving). Use the job description's phrasing. Order by importance to the role."
        },
        level: {
            type: "string",
            description: "My inferred seniority level based on resume experience (e.g. Junior, Mid, Senior, Staff, Principal)"
        },
        salary: {
            type: "string",
            description: "My estimated competitive annual salary range in USD (e.g. '$120,000 - $150,000') based on this role's level, location, and role market rates"
        },
        matchScore: {
            type: "number",
            description: "A 0-100 match score where required skills are weighted more heavily than preferred skills; 80+ indicates I meet most requirements"
        },
        summary: {
            type: "string",
            description: "2-4 sentence overview of my fit, key strengths relative to the role, and critical gaps"
        },
        suggestion: {
            type: "string",
            description: "2-3 concise, direct sentences of resume edits specifically tied to this job description — reference actual skills, titles, or requirements from the job posting. Each sentence must name a concrete change I can make (e.g. move a specific experience to the top, rewrite a bullet to include a skill listed as required, highlight a quantified outcome that maps to a stated responsibility)."
        },
        employeeSentimentScore: {
            type: "number",
            description: "Overall employee sentiment score from 1 (very negative) to 5 (very positive), derived from Glassdoor and Indeed review ratings. Only populate if a specific company name is identifiable in the job description; otherwise return null."
        }
    },
    required: ["matchingSkills", "missingSkills", "level", "salary", "matchScore", "summary", "suggestion", "employeeSentimentScore"],
    additionalProperties: false
};

export function buildPrompt(resume: string, job: string) {
    return [
        `You are a technical recruiter and hiring expert. Analyze how well my resume matches the job description.`,
        `Instructions:`,
        `- Extract concrete skills, technologies, tools, certifications, and qualifications from both documents.`,
        `- matchingSkills: Skills and technologies explicitly listed on my resume that also appear in the job description, plus any experience/tenure requirements (e.g. "3+ years of X") that my work history clearly satisfies. Do NOT infer specific skills or technologies that are not explicitly stated on my resume. Use the exact phrasing from the job description. Order by relevance to the role.`,
        `- missingSkills: Skills and technologies required or preferred in the job description that are NOT explicitly listed on my resume, plus any experience/tenure requirements I do not satisfy. Use the exact phrasing from the job description. Order by importance to the role.`,
        `- Do NOT include soft skills (e.g. "communication", "teamwork", "collaboration", "problem-solving", "leadership") in either list under any circumstances.`,
        `- level: Infer my seniority from my resume (e.g. "Junior", "Mid", "Senior", "Staff", "Principal"). Base this on years of experience, scope of past roles, and technical depth.`,
        `- salary: Estimate a competitive annual salary range in USD (e.g. "$120,000 - $150,000") based on the inferred level, location if mentioned, and market rates for the role.`,
        `- matchScore: A 0-100 score. Weight required skills more heavily than preferred/nice-to-have skills. A score of 70+ means I meet most requirements.`,
        `- summary: 2-4 sentences covering my fit, key strengths relative to the role, and the most critical gaps.`,
        `- suggestion: 2-3 short, direct sentences. Every sentence MUST reference something specific from the job description (a required skill, a stated responsibility, a job title, or a listed qualification) and pair it with a concrete resume edit. Do not give generic advice — if you mention rewriting a bullet, name the skill or requirement it should reflect; if you recommend reordering my experience, name the role or technology from the job posting that justifies it.`,
        `- employeeSentimentScore: ONLY provide this if a specific company name is clearly stated in the job description. A 1–5 integer score (1 = very negative, 5 = very positive) derived from Glassdoor and Indeed ratings. Return null if no company name is present or no data is available.`,
        `<Resume>\n${resume}\n</Resume>`,
        `<Job Description>\n${job}\n</Job Description>`
    ].join('\n');
}
