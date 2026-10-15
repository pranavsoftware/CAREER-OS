"""
Career-OS Text Normalizer for TTS & Speech Synthesis.
Expands technical jargon, acronyms, time complexities, and adds natural conversational pauses.
"""

import re

# Technical pronunciation & expansion dictionary
TECH_DICTIONARY = {
    # Acronyms & Architectures
    r"\bCI/CD\b": "C I C D",
    r"\bJWT\b": "J W T",
    r"\bREST\b": "rest",
    r"\bRESTful\b": "restful",
    r"\bAPI\b": "A P I",
    r"\bAPIs\b": "A P Is",
    r"\bSDK\b": "S D K",
    r"\bSDKs\b": "S D Ks",
    r"\bCLI\b": "C L I",
    r"\bGUI\b": "G U I",
    r"\bUI/UX\b": "U I U X",
    r"\bUI\b": "U I",
    r"\bUX\b": "U X",
    r"\bRPC\b": "R P C",
    r"\bgRPC\b": "G R P C",
    r"\bGraphQL\b": "Graph Q L",
    r"\bOAuth\b": "O Auth",
    r"\bOAuth2\b": "O Auth two",
    r"\bSSO\b": "S S O",
    r"\bSAML\b": "sam-el",
    
    # Databases & Storage
    r"\bSQL\b": "sequel",
    r"\bNoSQL\b": "no sequel",
    r"\bPostgreSQL\b": "Postgres Q L",
    r"\bPostgres\b": "Postgres",
    r"\bMySQL\b": "My S Q L",
    r"\bSQLite\b": "S Q L lite",
    r"\bRedis\b": "red-iss",
    r"\bB-tree\b": "bee tree",
    r"\bB\+ tree\b": "bee plus tree",
    r"\bB\+tree\b": "bee plus tree",
    r"\bACID\b": "acid",
    r"\bCRUD\b": "crud",
    r"\bORM\b": "O R M",
    
    # Cloud & DevOps
    r"\bk8s\b": "kubernetes",
    r"\bK8s\b": "kubernetes",
    r"\bKubernetes\b": "kubernetes",
    r"\bAWS\b": "A W S",
    r"\bGCP\b": "G C P",
    r"\bS3\b": "S three",
    r"\bEC2\b": "E C two",
    r"\bIAM\b": "I A M",
    r"\bDevOps\b": "Dev Ops",
    r"\bSysAdmin\b": "Sys Admin",
    
    # Protocols & Networking
    r"\bHTTPS\b": "H T T P S",
    r"\bHTTP\b": "H T T P",
    r"\bTCP/IP\b": "T C P I P",
    r"\bTCP\b": "T C P",
    r"\bUDP\b": "U D P",
    r"\bDNS\b": "D N S",
    r"\bSSL\b": "S S L",
    r"\bTLS\b": "T L S",
    r"\bIP\b": "I P",
    r"\bURL\b": "U R L",
    r"\bURLs\b": "U R Ls",
    r"\bURI\b": "U R I",
    r"\bLAN\b": "lan",
    r"\bWAN\b": "wan",
    r"\bVPC\b": "V P C",
    r"\bCDN\b": "C D N",
    r"\bWebSocket\b": "Web Socket",
    r"\bWebSockets\b": "Web Sockets",
    
    # Frontend / Languages
    r"\bHTML\b": "H T M L",
    r"\bHTML5\b": "H T M L five",
    r"\bCSS\b": "C S S",
    r"\bCSS3\b": "C S S three",
    r"\bJS\b": "JavaScript",
    r"\bTS\b": "TypeScript",
    r"\bJSX\b": "J S X",
    r"\bTSX\b": "T S X",
    r"\bDOM\b": "dom",
    r"\bJSON\b": "Jason",
    r"\bYAML\b": "yam-el",
    r"\bXML\b": "X M L",
    r"\bC\+\+\b": "C plus plus",
    r"\bC#\b": "C sharp",
    r"\bNode\.js\b": "Node J S",
    r"\bNext\.js\b": "Next J S",
    r"\bVue\.js\b": "Vue J S",
    r"\bReact\.js\b": "React J S",
    
    # Hardware & Performance
    r"\bCPU\b": "C P U",
    r"\bGPU\b": "G P U",
    r"\bRAM\b": "ram",
    r"\bSSD\b": "S S D",
    r"\bI/O\b": "I O",
    r"\bOS\b": "O S",
    r"\bVM\b": "V M",
    r"\bVMs\b": "V Ms",
    
    # Big-O Complexities
    r"O\(1\)": "O of one",
    r"O\(n\)": "O of n",
    r"O\(N\)": "O of N",
    r"O\(n\^2\)": "O of n squared",
    r"O\(N\^2\)": "O of N squared",
    r"O\(log\s*n\)": "O of log n",
    r"O\(n\s*log\s*n\)": "O of n log n",
}

# Transitional markers to add a light conversational breath/pause
PAUSE_PREFIXES = [
    r"^(Well|Now|Alright|Great|First|Second|Third|Finally|Interestingly|Specifically|For example|For instance),?\s*"
]


def clean_markdown(text: str) -> str:
    """Removes markdown formatting characters like backticks, bold asterisks, and bullet points."""
    # Remove code blocks
    text = re.sub(r"```[\s\S]*?```", "", text)
    # Remove inline backticks
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # Remove bold/italic asterisks
    text = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", text)
    # Remove markdown headers (#, ##, etc.)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    # Remove bullet markers (- or * at start of lines)
    text = re.sub(r"^\s*[-*•]\s*", "", text, flags=re.MULTILINE)
    # Remove markdown links [title](url) -> title
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text.strip()


def normalize_for_tts(text: str) -> str:
    """
    Main normalization pipeline:
    1. Clean markdown artifacts
    2. Expand technical acronyms and symbols
    3. Insert conversational pauses and commas
    4. Normalize spacing
    """
    if not text:
        return ""

    normalized = clean_markdown(text)

    # Replace dictionary patterns
    for pattern, replacement in TECH_DICTIONARY.items():
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)

    # Insert slight pause comma after common interview intro words
    for prefix_pat in PAUSE_PREFIXES:
        normalized = re.sub(prefix_pat, r"\1, ", normalized, flags=re.IGNORECASE)

    # Replace ellipses with single periods for cleaner TTS pacing
    normalized = re.sub(r"\.{2,}", ".", normalized)

    # Ensure single spaces
    normalized = re.sub(r"\s+", " ", normalized).strip()

    return normalized


if __name__ == "__main__":
    test_cases = [
        "Welcome! Can you explain how a B-tree index optimizes SQL query performance?",
        "First how would you design a CI/CD pipeline with Docker and k8s?",
        "What is the average time complexity of quicksort? Is it O(n log n) or O(n^2)?",
        "Explain the difference between **REST** and **GraphQL** when parsing JSON tokens with `JWT`.",
    ]
    print("--- Text Normalizer Test ---")
    for t in test_cases:
        print(f"Original:   {t}")
        print(f"Normalized: {normalize_for_tts(t)}\n")
