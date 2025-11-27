import { GoogleGenAI } from "@google/genai";
import { Developer, DeveloperPlan, Project } from "../types";
import { format } from "date-fns";

export const analyzeCapacity = async (
  developers: Developer[],
  projects: Project[],
  plans: DeveloperPlan[],
  startDate: Date
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a summarized payload for the AI to minimize token usage and improve relevance
  const weekStartStr = format(startDate, 'yyyy-MM-dd');
  const summary = developers.map(dev => {
    const plan = plans.find(p => p.developerId === dev.id);
    if (!plan) return null;

    let totalWeeklyHours = 0;
    const dailyBreakdown: Record<string, number> = {};

    plan.projects.forEach(proj => {
      Object.entries(proj.allocations).forEach(([date, hours]) => {
        // Only count current week (simple filter based on string match would be better done by checking date range, 
        // but for this snippet we assume the payload passed is relevant to the view)
        dailyBreakdown[date] = (dailyBreakdown[date] || 0) + hours;
        totalWeeklyHours += hours;
      });
    });

    const projectNames = plan.projects
      .map(p => projects.find(proj => proj.id === p.projectId)?.name)
      .filter(Boolean);

    return {
      name: dev.name,
      role: dev.role,
      totalWeeklyHours,
      assignedProjects: projectNames,
      absences: plan.absences,
      dailyLoads: dailyBreakdown
    };
  }).filter(Boolean);

  const prompt = `
    You are an expert Engineering Manager assistant.
    Analyze the following capacity planning data for the week starting ${weekStartStr}.
    
    Data: ${JSON.stringify(summary, null, 2)}
    
    Please provide a concise analysis in HTML format (using <ul>, <li>, <strong> tags only, no markdown blocks) covering:
    1. **Overloaded Resources**: Anyone with > 8 hours/day or > 40 hours/week.
    2. **Underutilized Resources**: Anyone with < 30 hours/week (unless on leave).
    3. **Risk Assessment**: Any project dependencies at risk due to lack of allocation?
    4. **Suggestions**: 1-2 quick balancing moves.
    
    Keep the tone professional and actionable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate analysis. Please try again later.";
  }
};