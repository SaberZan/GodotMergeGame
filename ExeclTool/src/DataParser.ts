import xlsx from 'node-xlsx';
import fs from 'fs';
import path from 'path';
import CsvParser from './CsvParser';

export default class DataParser {
    /**
     * Parse a data file (xlsx or CSV directory)
     * Returns data in the same format as node-xlsx.parse()
     */
    public static parse(filePath: string): any[] {
        let data: any[] = [];
        
        // Try CSV first, then fall back to xlsx
        if (CsvParser.canParseAsCsv(filePath)) {
            data = CsvParser.parse(filePath);
        }
        
        // If no CSV data found, try xlsx
        if (data.length === 0 && fs.existsSync(filePath)) {
            data = xlsx.parse(filePath);
        }
        
        return data;
    }

    /**
     * Parse a data file with optional extension
     * First tries the path as-is, then tries with .xlsx extension
     */
    public static parseWithOptionalExtension(pathStr: string): any[] {
        let data = this.parse(pathStr);
        
        // If not found, try with xlsx extension
        if (data.length === 0) {
            let parsedPath = path.parse(pathStr);
            parsedPath.base += '.xlsx';
            parsedPath.ext = '.xlsx';
            data = this.parse(path.format(parsedPath));
        }
        
        return data;
    }
}
