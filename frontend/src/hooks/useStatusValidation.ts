
// Mirrors backend status grouping
const StatusRank: { [key: string]: number } = {
    "Applied": 1,
    "Screening Interview": 2,
    "Mid-stage Interview": 3,
    "Final Interview": 4,
    "Offer": 5,
    "Rejected": 6,
    "Ghosted": 7
};

const ALL_STATUSES = Object.keys(StatusRank);
const DefinitiveEndStates = ["Offer", "Rejected", "Ghosted"];

export const useStatusValidation = () => {

    const getValidNextStatuses = (currentStatus: string): string[] => {
        const currentRank = StatusRank[currentStatus];
        if (currentRank === undefined) {
            return ALL_STATUSES; 
        }

        // Block movement out of definitive end states
        if (DefinitiveEndStates.includes(currentStatus)) {
            return [currentStatus];
        }
        
        const validNextStatuses = ALL_STATUSES.filter(newStatus => {
            const newRank = StatusRank[newStatus];
            // Block movement back to Applied
            if (newStatus === "Applied") {
                return false;
            }

            // Only allow moving to any "higher" rank status (Forward progression)
            if (newRank > currentRank) {
                return true;
            }

            return newStatus === currentStatus; 
        });

        // Ensure the current status is always a selectable option 
        if (!validNextStatuses.includes(currentStatus)) {
            validNextStatuses.push(currentStatus);
        }
        
        return validNextStatuses.sort((a, b) => StatusRank[a] - StatusRank[b]);
    };

    return { getValidNextStatuses, ALL_STATUSES };
};