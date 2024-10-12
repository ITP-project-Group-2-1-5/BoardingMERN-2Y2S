// import { utils, writeFile } from 'xlsx';
import { utils, writeFile } from 'xlsx-js-style';

export const exportToExcel = (data, fileName) => {
    
    const wb = utils.book_new();
    const ws = utils.json_to_sheet([]);

    // MERGE title cells
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { c: 3, r: 0 }, e: { c: 8, r: 0 } }); // Merge cells from D1 to I1

    // Title Styling and Text
    const range = ['D1', 'E1', 'F1', 'G1', 'H1', 'I1'];
    range.forEach(cell => {
      ws[cell] = {
        v: "UniBodim Finder - Map Report",  
        t: 's',  
        s: {
          font: {
            bold: true,  
            sz: 18, 
            color: { rgb: "1E2A5E" }  
          },
          alignment: {
            vertical: 'center',  
            horizontal: 'center'  
          },
          fill: {
            fgColor: { rgb: 'FABC3F' } 
          }
        }
      };
    });

    // Get the current date and format it
    const currentDate = new Date().toLocaleDateString(); 

    // Add the date specifically to F2
    ws['F2'] = {
        v: `Report Date: ${currentDate}`,  // Use backticks for string interpolation
        t: 's', 
        s: {
            font: {
                bold: true, 
                sz: 14, 
                color: { rgb: "C7253E" } 
            },
            alignment: {
                vertical: 'center',
                horizontal: 'left',
            }
        }
    };

    // Set column widths
    if (!ws['!cols']) ws['!cols'] = [];
    ws['!cols'][3] = { wch: 25 }; 
    ws['!cols'][1] = { wch: 25 };
    ws['!cols'][2] = { wch: 25 };
    ws['!cols'][7] = { wch: 12 };
    ws['!cols'][8] = { wch: 25 };
    ws['!cols'][9] = { wch: 25 };
    ws['!cols'][10] = { wch: 25 };
    ws['!cols'][11] = { wch: 0 };
    ws['!cols'][12] = { wch: 15 };

    // Set row heights
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 50 }; 
    ws['!rows'][1] = { hpt: 25 }; 
    ws['!rows'][2] = { hpt: 25 }; // Adjust height for the date row
    ws['!rows'][4] = { hpt: 25 }; 

    // Center-align specific columns
    const centerColumns = ['A', 'E', 'F', 'G', 'H', 'M'];
    centerColumns.forEach(col => {
        for (let i = 5; i <= data.length + 5; i++) { // Ensure last row is included
            const cell = `${col}${i}`; // Use template literals to dynamically reference cells
            if (!ws[cell]) ws[cell] = {}; // Create the cell if it doesn't exist
            ws[cell].s = {
                alignment: {
                    vertical: 'center',
                    horizontal: 'center'
                }
            };
        }
    });

    // Add the data starting from row 5
    utils.sheet_add_json(ws, data, { origin: "A5" });
    utils.book_append_sheet(wb, ws, "Feedback");

    // Write the workbook to the file
    writeFile(wb, fileName); 
};
