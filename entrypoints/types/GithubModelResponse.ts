export type GithubModelResponse = {
    matchScore: number,
    matchingSkills: string[],
    missingSkills: string[],
    level: string,
    salary: string,
    summary: string
}