export function generateNameFromUsername(username) {
    // Remove @ symbol and split by common delimiters
    const cleanUsername = username.replace('@', '').toLowerCase();
    const parts = cleanUsername.split(/[-_.]/).filter(part => part.length > 0);
    
    // Nigerian/African surnames pool
    const surnames = [
        'Okafor', 'Adeyemi', 'Bello', 'Okonkwo', 'Adeleke',
        'Musa', 'Nwosu', 'Williams', 'Ibrahim', 'Eze',
        'Ahmed', 'Chukwu', 'Johnson', 'Yusuf', 'Obi',
        'Hassan', 'Okeke', 'Afolabi', 'Umar', 'Udoh',
        'Sani', 'Nwankwo', 'Adeyinka', 'Idris', 'Onyeka',
        'Lawal', 'Igwe', 'Babatunde', 'Garba', 'Nnadi',
        'Aliyu', 'Okadigbo', 'Oyewole', 'Abubakar', 'Chidi',
        'Suleiman', 'Emeka', 'Oyekunle', 'Usman', 'Nwachukwu',
        'Ismail', 'Agu', 'Ogunleye', 'Mohammed', 'Onyekachi',
        'Nuhu', 'Okoye', 'Adewale', 'Bashir', 'Dickson'
    ];
    
    // Capitalize first letter of each part
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    
    let firstName = '';
    let lastName = '';
    
    if (parts.length >= 2) {
        // If we have multiple parts (e.g., @akeem-dickson)
        firstName = capitalize(parts[0]);
        lastName = capitalize(parts[1]);
    } else if (parts.length === 1) {
        // Single part (e.g., @akeem) - capitalize and add surname
        firstName = capitalize(parts[0]);
        
        // Generate consistent surname based on username hash
        const hash = parts[0].split('').reduce((acc, char) => 
            acc + char.charCodeAt(0), 0);
        lastName = surnames[hash % surnames.length];
    } else {
        // Fallback
        firstName = 'User';
        lastName = 'Account';
    }
    
    return `${firstName} ${lastName}`;
}

// Helper function to generate consistent 10-digit account number
export function generateAccountNumber(username) {
    // Create a deterministic seed from username
    const seed = username.split('').reduce((acc, char, index) => {
        return acc + char.charCodeAt(0) * (index + 1);
    }, 0);
    
    // Use a simple seeded random generator for consistency
    let randomSeed = seed;
    const seededRandom = () => {
        randomSeed = (randomSeed * 9301 + 49297) % 233280;
        return randomSeed / 233280;
    };
    
    // Generate 10-digit number
    // First digit: 0-0 (common Nigerian bank format starts with 0)
    // Remaining digits: random but consistent
    let accountNumber = '0';
    
    for (let i = 0; i < 9; i++) {
        accountNumber += Math.floor(seededRandom() * 10);
    }
    
    return accountNumber;
}
