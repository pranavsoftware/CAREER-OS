/**
 * Placement Coding Questions Bank
 * Covers core placement topics: Arrays, Strings, Two Pointers, Linked Lists,
 * Trees, Dynamic Programming, and ML/Algorithms.
 */
export const CODING_QUESTIONS = [
  {
    id: 'code_1',
    title: 'Two Sum',
    topic: 'Arrays & Hashing',
    difficulty: 'Easy',
    acceptanceRate: '88%',
    companies: ['Amazon', 'Google', 'Microsoft', 'TCS', 'Infosys'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        input: 'nums = [3, 3], target = 6',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterTemplates: {
      python: `def two_sum(nums, target):
    # Write your solution here
    # Return a list of two indices [i, j]
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
`,
      javascript: `function twoSum(nums, target) {
  // Write your solution here
  // Return an array of two indices [i, j]
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }
}`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 'nums = [2, 7, 11, 15], target = 9',
        args: [[2, 7, 11, 15], 9],
        expectedOutput: [0, 1],
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 'nums = [3, 2, 4], target = 6',
        args: [[3, 2, 4], 6],
        expectedOutput: [1, 2],
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 'nums = [3, 3], target = 6',
        args: [[3, 3], 6],
        expectedOutput: [0, 1],
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 'nums = [1, 5, 8, 12, 19], target = 20',
        args: [[1, 5, 8, 12, 19], 20],
        expectedOutput: [0, 4],
        isHidden: true,
      },
      {
        id: 5,
        inputDisplay: 'nums = [-3, 4, 3, 90], target = 0',
        args: [[-3, 4, 3, 90], 0],
        expectedOutput: [0, 2],
        isHidden: true,
      },
    ],
    optimalComplexity: {
      time: 'O(n)',
      space: 'O(n)',
    },
    hints: [
      'A brute force approach would search all pairs in O(n^2). Can we do better?',
      'Can we use a Hash Table to look up the complement (target - current_number) in O(1) time?',
    ],
  },
  {
    id: 'code_2',
    title: 'Valid Palindrome',
    topic: 'Strings & Two Pointers',
    difficulty: 'Easy',
    acceptanceRate: '82%',
    companies: ['Amazon', 'Facebook', 'Microsoft', 'Accenture'],
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` *if it is a palindrome, or* \`false\` *otherwise*.`,
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
      {
        input: 's = "race a car"',
        output: 'false',
        explanation: '"raceacar" is not a palindrome.',
      },
      {
        input: 's = " "',
        output: 'true',
        explanation: 's is an empty string "" after removing non-alphanumeric characters. Since an empty string reads the same forward and backward, it is a palindrome.',
      },
    ],
    constraints: [
      '1 <= s.length <= 2 * 10^5',
      's consists only of printable ASCII characters.',
    ],
    starterTemplates: {
      python: `def is_palindrome(s):
    # Write your solution here
    # Return True or False
    cleaned = [c.lower() for c in s if c.isalnum()]
    return cleaned == cleaned[::-1]
`,
      javascript: `function isPalindrome(s) {
  // Write your solution here
  // Return boolean true or false
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}`,
      java: `class Solution {
    public boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }
}`,
      cpp: `#include <string>
#include <cctype>
using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            while (left < right && !isalnum(s[left])) left++;
            while (left < right && !isalnum(s[right])) right--;
            if (tolower(s[left]) != tolower(s[right])) return false;
            left++;
            right--;
        }
        return true;
    }
};`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 's = "A man, a plan, a canal: Panama"',
        args: ['A man, a plan, a canal: Panama'],
        expectedOutput: true,
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 's = "race a car"',
        args: ['race a car'],
        expectedOutput: false,
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 's = " "',
        args: [' '],
        expectedOutput: true,
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 's = "Was it a car or a cat I saw?"',
        args: ['Was it a car or a cat I saw?'],
        expectedOutput: true,
        isHidden: true,
      },
      {
        id: 5,
        inputDisplay: 's = "0P"',
        args: ['0P'],
        expectedOutput: false,
        isHidden: true,
      },
    ],
    optimalComplexity: {
      time: 'O(n)',
      space: 'O(1)',
    },
    hints: [
      'Two pointers moving from both ends inward avoids allocating extra strings.',
    ],
  },
  {
    id: 'code_3',
    title: "Maximum Subarray (Kadane's Algorithm)",
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    acceptanceRate: '68%',
    companies: ['Google', 'Amazon', 'Microsoft', 'Oracle', 'Wipro'],
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.

A **subarray** is a contiguous non-empty sequence of elements within an array.`,
    examples: [
      {
        input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        output: '6',
        explanation: 'The subarray [4, -1, 2, 1] has the largest sum 6.',
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.',
      },
      {
        input: 'nums = [5, 4, -1, 7, 8]',
        output: '23',
        explanation: 'The subarray [5, 4, -1, 7, 8] has the largest sum 23.',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    starterTemplates: {
      python: `def max_sub_array(nums):
    # Implement Kadane's Algorithm
    max_sum = nums[0]
    cur_sum = 0
    for n in nums:
        cur_sum = max(n, cur_sum + n)
        max_sum = max(max_sum, cur_sum)
    return max_sum
`,
      javascript: `function maxSubArray(nums) {
  // Implement Kadane's Algorithm
  let maxSum = nums[0];
  let curSum = 0;
  for (const n of nums) {
    curSum = Math.max(n, curSum + n);
    maxSum = Math.max(maxSum, curSum);
  }
  return maxSum;
}`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        int maxSum = nums[0];
        int curSum = 0;
        for (int n : nums) {
            curSum = Math.max(n, curSum + n);
            maxSum = Math.max(maxSum, curSum);
        }
        return maxSum;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxSum = nums[0];
        int curSum = 0;
        for (int n : nums) {
            curSum = max(n, curSum + n);
            maxSum = max(maxSum, curSum);
        }
        return maxSum;
    }
};`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]],
        expectedOutput: 6,
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 'nums = [1]',
        args: [[1]],
        expectedOutput: 1,
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 'nums = [5, 4, -1, 7, 8]',
        args: [[5, 4, -1, 7, 8]],
        expectedOutput: 23,
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 'nums = [-5, -2, -8, -1]',
        args: [[-5, -2, -8, -1]],
        expectedOutput: -1,
        isHidden: true,
      },
      {
        id: 5,
        inputDisplay: 'nums = [-2, -1]',
        args: [[-2, -1]],
        expectedOutput: -1,
        isHidden: true,
      },
    ],
    optimalComplexity: {
      time: 'O(n)',
      space: 'O(1)',
    },
    hints: [
      'If the current running sum becomes negative, would continuing with it help subsequent elements?',
    ],
  },
  {
    id: 'code_4',
    title: 'Valid Parentheses',
    topic: 'Stacks & Queues',
    difficulty: 'Easy',
    acceptanceRate: '86%',
    companies: ['Amazon', 'Microsoft', 'Bloomberg', 'TCS'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'Simple valid matching parenthesis pair.',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'All three brackets properly closed.',
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: 'Mismatched closing bracket type.',
      },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only "()[]{}".',
    ],
    starterTemplates: {
      python: `def is_valid_parentheses(s):
    # Use stack data structure
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack
`,
      javascript: `function isValidParentheses(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const c of s) {
    if (map[c]) {
      const top = stack.length ? stack.pop() : '#';
      if (map[c] !== top) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.length === 0;
}`,
      java: `class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
      cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(') st.push(')');
            else if (c == '{') st.push('}');
            else if (c == '[') st.push(']');
            else if (st.empty() || st.top() != c) return false;
            else st.pop();
        }
        return st.empty();
    }
};`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 's = "()"',
        args: ['()'],
        expectedOutput: true,
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 's = "()[]{}"',
        args: ['()[]{}'],
        expectedOutput: true,
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 's = "(]"',
        args: ['(]'],
        expectedOutput: false,
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 's = "([{}])"',
        args: ['([{}])'],
        expectedOutput: true,
        isHidden: true,
      },
      {
        id: 5,
        inputDisplay: 's = "((("',
        args: ['((('],
        expectedOutput: false,
        isHidden: true,
      },
    ],
    optimalComplexity: {
      time: 'O(n)',
      space: 'O(n)',
    },
    hints: [
      'A Stack data structure guarantees Last-In First-Out matching.',
    ],
  },
  {
    id: 'code_5',
    title: 'Coin Change (Minimum Coins)',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    acceptanceRate: '54%',
    companies: ['Amazon', 'Google', 'Flipkart', 'Paytm'],
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    examples: [
      {
        input: 'coins = [1, 2, 5], amount = 11',
        output: '3',
        explanation: '11 = 5 + 5 + 1 (3 coins)',
      },
      {
        input: 'coins = [2], amount = 3',
        output: '-1',
        explanation: 'Amount 3 cannot be made with coin of 2.',
      },
      {
        input: 'coins = [1], amount = 0',
        output: '0',
        explanation: 'Zero amount requires 0 coins.',
      },
    ],
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4',
    ],
    starterTemplates: {
      python: `def coin_change(coins, amount):
    # Bottom-up Dynamic Programming
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1
`,
      javascript: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const coin of coins) {
    for (let x = coin; x <= amount; x++) {
      dp[x] = Math.min(dp[x], dp[x - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int coin : coins) {
            for (int i = coin; i <= amount; i++) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> dp(amount + 1, amount + 1);
        dp[0] = 0;
        for (int coin : coins) {
            for (int i = coin; i <= amount; i++) {
                dp[i] = min(dp[i], dp[i - coin] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 'coins = [1, 2, 5], amount = 11',
        args: [[1, 2, 5], 11],
        expectedOutput: 3,
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 'coins = [2], amount = 3',
        args: [[2], 3],
        expectedOutput: -1,
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 'coins = [1], amount = 0',
        args: [[1], 0],
        expectedOutput: 0,
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 'coins = [2, 5, 10, 1], amount = 27',
        args: [[2, 5, 10, 1], 27],
        expectedOutput: 4,
        isHidden: true,
      },
    ],
    optimalComplexity: {
      time: 'O(S * n) where S is amount, n is coin count',
      space: 'O(S)',
    },
    hints: [
      'Initialize an array dp of size amount + 1 with infinity, where dp[0] = 0.',
      'For each coin, iterate x from coin to amount.',
    ],
  },
  {
    id: 'code_6',
    title: 'Compute Classification Metrics (Precision, Recall, F1)',
    topic: 'Machine Learning / Algorithms',
    difficulty: 'Medium',
    acceptanceRate: '71%',
    companies: ['Google AI', 'Meta', 'Swiggy', 'Zomato'],
    description: `Write a function that calculates **Precision**, **Recall**, and **F1-Score** from ground truth binary labels \`y_true\` and predicted labels \`y_pred\` without using any external machine learning libraries.

Return an object / dictionary with rounded floats to 3 decimal places:
\`\`\`json
{
  "precision": 0.833,
  "recall": 0.714,
  "f1_score": 0.769
}
\`\`\`
Ensure safeguards against zero-division (return 0.0 if denominator is 0).`,
    examples: [
      {
        input: 'y_true = [1, 0, 1, 1, 0, 1], y_pred = [1, 0, 1, 0, 0, 1]',
        output: '{"precision": 1.0, "recall": 0.75, "f1_score": 0.857}',
        explanation: 'TP = 3, FP = 0, FN = 1. Precision = 3/3 = 1.0, Recall = 3/4 = 0.75, F1 = 2*(1.0*0.75)/(1.75) = 0.857',
      },
    ],
    constraints: [
      'y_true.length == y_pred.length',
      'Labels are integers 0 or 1.',
    ],
    starterTemplates: {
      python: `def compute_classification_metrics(y_true, y_pred):
    tp = fp = fn = 0
    for true, pred in zip(y_true, y_pred):
        if true == 1 and pred == 1:
            tp += 1
        elif true == 0 and pred == 1:
            fp += 1
        elif true == 1 and pred == 0:
            fn += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1_score": round(f1, 3)
    }
`,
      javascript: `function computeClassificationMetrics(y_true, y_pred) {
  let tp = 0, fp = 0, fn = 0;
  for (let i = 0; i < y_true.length; i++) {
    if (y_true[i] === 1 && y_pred[i] === 1) tp++;
    else if (y_true[i] === 0 && y_pred[i] === 1) fp++;
    else if (y_true[i] === 1 && y_pred[i] === 0) fn++;
  }
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0.0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0.0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0.0;
  return {
    precision: Number(precision.toFixed(3)),
    recall: Number(recall.toFixed(3)),
    f1_score: Number(f1.toFixed(3)),
  };
}`,
      java: `// Return metrics as Map<String, Double>`,
      cpp: `// Return metrics as unordered_map<string, double>`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 'y_true = [1, 0, 1, 1, 0, 1], y_pred = [1, 0, 1, 0, 0, 1]',
        args: [[1, 0, 1, 1, 0, 1], [1, 0, 1, 0, 0, 1]],
        expectedOutput: { precision: 1.0, recall: 0.75, f1_score: 0.857 },
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 'y_true = [1, 1, 1], y_pred = [0, 0, 0]',
        args: [[1, 1, 1], [0, 0, 0]],
        expectedOutput: { precision: 0.0, recall: 0.0, f1_score: 0.0 },
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 'y_true = [1, 0, 0, 1], y_pred = [1, 1, 0, 1]',
        args: [[1, 0, 0, 1], [1, 1, 0, 1]],
        expectedOutput: { precision: 0.667, recall: 1.0, f1_score: 0.8 },
        isHidden: true,
      },
    ],
    optimalComplexity: {
      time: 'O(n)',
      space: 'O(1)',
    },
    hints: [
      'Count True Positives (1 and 1), False Positives (0 and 1), and False Negatives (1 and 0).',
    ],
  },
];
