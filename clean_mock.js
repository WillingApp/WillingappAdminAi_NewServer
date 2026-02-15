const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, 'src', 'data', 'ReportsDataMock.json');

try {
    const data = JSON.parse(fs.readFileSync(mockPath, 'utf8'));

    const updatedData = data.map(entry => {
        if (entry.report && entry.report.status === 1) {
            return {
                ...entry,
                report: {
                    ...entry.report,
                    handledByAdminId: null
                },
                admin: {}
            };
        }
        return entry;
    });

    fs.writeFileSync(mockPath, JSON.stringify(updatedData, null, 4), 'utf8');
    console.log('Successfully updated ReportsDataMock.json');
} catch (error) {
    console.error('Error processing mock data:', error);
}
