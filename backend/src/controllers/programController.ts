import { Request, Response } from "express";
import Program from "../models/Program.js";

// GET /api/programs — List all active programs
export const getPrograms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const programs = await Program.find({ isActive: true }).sort({ createdAt: 1 });
    res.json({ success: true, data: programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch programs" });
  }
};

// GET /api/programs/:id — Get single program
export const getProgramById = async (req: Request, res: Response): Promise<void> => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      res.status(404).json({ success: false, message: "Program not found" });
      return;
    }
    res.json({ success: true, data: program });
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ success: false, message: "Failed to fetch program" });
  }
};
