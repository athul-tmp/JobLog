
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
const ProgressionStates = ["Screening Interview", "Mid-stage Interview", "Final Interview"];
const DefinitiveEndStates = ["Offer", "Rejected"];


export const useStatusValidation = () => {

    const getValidNextStatuses = (currentStatus: string): string[] => {
        const currentRank = StatusRank[currentStatus];
        if (currentRank === undefined) {
            return ALL_STATUSES; 
        }

        // Block movement out of definitive end states
        if (DefinitiveEndStates.includes(currentStatus)) {
            return DefinitiveEndStates.filter(s => s !== currentStatus);
        }

        
        const validNextStatuses = ALL_STATUSES.filter(newStatus => {
            const newRank = StatusRank[newStatus];
            // Block movement back to Applied
            if (newStatus === "Applied") {
                return false;
            }

            // Block backward movement within Interview states
            if (ProgressionStates.includes(currentStatus) && ProgressionStates.includes(newStatus)) {
                return newRank >= currentRank;
            }
            
            // Allow movement out of Ghosted to any ProgressionStates or DefinitiveEndStates
            if (currentStatus === "Ghosted") {
                return true; 
            }

            // Applied moving to any status allowed
            if (currentRank < newRank) {
                return true;
            }
            
            // Allow moving from any status to an End State (Offer/Rejected/Ghosted)
            if (DefinitiveEndStates.includes(newStatus) || newStatus === "Ghosted") {
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