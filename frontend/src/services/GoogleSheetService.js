import { read, utils } from 'xlsx';

// Helper to process rows into the application data structure
const processFinanceDataRows = (rows) => {
    const data = {
        kpis: {
            avgSprintCost: { value: 0, trend: 0 },
            budgetUtilization: { value: 0, status: '' },
            roi: { value: 0, topInitiative: '' },
            anomalies: { value: 'None', status: '' }
        },
        insights: [],
        sprintCosts: [],
        costVsValue: [],
        budgetBurn: []
    };

    rows.forEach(row => {
        // Handle array from XLSX (which might be typed) or CSV (strings)
        const section = row[0]?.toString().trim();
        const key = row[1]?.toString().trim();
        const val1 = row[2]?.toString().trim();
        const val2 = row[3]?.toString().trim();
        const val3 = row[4]?.toString().trim();

        if (section === 'KPI') {
            if (key === 'AvgSprintCost') data.kpis.avgSprintCost = { value: parseFloat(val1), trend: parseFloat(val2) };
            if (key === 'BudgetUtilization') data.kpis.budgetUtilization = { value: parseFloat(val1), status: val2 };
            if (key === 'ROI') data.kpis.roi = { value: parseFloat(val1), topInitiative: val2 };
            if (key === 'Anomalies') data.kpis.anomalies = { value: val1, status: val2 };
        } else if (section === 'Insight') {
            data.insights.push({ type: key, title: val1, value: val2, description: val3 });
        } else if (section === 'Chart_Sprint') {
            data.sprintCosts.push({ sprint: key, cost: parseFloat(val1), budget: parseFloat(val2) });
        } else if (section === 'Chart_Scatter') {
            data.costVsValue.push({ feature: key, cost: parseFloat(val1), value: parseFloat(val2), roi: parseFloat(val3) });
        } else if (section === 'Chart_Burn') {
            data.budgetBurn.push({
                month: key,
                actual: val1 && val1 !== 'null' ? parseFloat(val1) : null,
                budget: parseFloat(val2),
                forecast: parseFloat(val3)
            });
        }
    });

    return data;
};

// Simple CSV parser without external dependencies for robustness in this environment
export const fetchFinanceData = async (url = "/finance_data.csv") => {
    try {
        let text;
        let sheetUrl = localStorage.getItem('finance_sheet_url');
        const localData = localStorage.getItem('finance_data_csv');

        if (sheetUrl) {
            // Robust URL handling
            let fetchUrl = sheetUrl;

            // Extract Sheet ID if possible to construct a clean export URL
            const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match && match[1]) {
                fetchUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
            }

            console.log("Fetching finance data from Google Sheet:", fetchUrl);
            const response = await fetch(fetchUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}`);
            }

            text = await response.text();

            // Basic validation to ensure we got CSV and not HTML (login page)
            if (text.trim().startsWith('<!DOCTYPE html>') || text.includes('<html')) {
                console.error("Received HTML instead of CSV. The sheet might not be public.");
                throw new Error("Google Sheet is not public or returned HTML.");
            }
        } else if (localData) {
            console.log("Loading finance data from local storage upload...");
            text = localData;
        } else {
            console.log("Loading default finance data...");
            const response = await fetch(url);
            text = await response.text();
        }

        const rows = text.split('\n').map(row => row.split(','));

        // Remove header
        const dataRows = rows.slice(1).filter(r => r.length > 1);

        return processFinanceDataRows(dataRows);
    } catch (error) {
        console.error("Failed to fetch finance data:", error);
        return null;
    }
};

export const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to array of arrays
                const rows = utils.sheet_to_json(worksheet, { header: 1 });

                // Remove header if present (assuming first row is header)
                const dataRows = rows.slice(1).filter(r => r.length > 0);

                const financeData = processFinanceDataRows(dataRows);
                resolve(financeData);
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
