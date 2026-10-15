/**
 * Automated Adaptive Question Generation & Problem-Solving Level-Up Engine
 * Runs 100% self-hosted with zero external vendor API calls.
 */

export const LEVEL_TIERS = {
  1: { title: 'Level 1: Algorithmic Novice', badge: 'Novice', minSolved: 0 },
  2: { title: 'Level 2: Problem Solver', badge: 'Intermediate', minSolved: 2 },
  3: { title: 'Level 3: Algorithm Specialist', badge: 'Advanced', minSolved: 4 },
  4: { title: 'Level 4: Placement Master', badge: 'Master', minSolved: 6 },
  5: { title: 'Level 5: Competitive Grandmaster', badge: 'Grandmaster', minSolved: 10 },
};

/**
 * Progression Graph: Maps solved problems to their higher-order algorithmic successors
 */
const CODING_LEVEL_UP_PROGRESSION = [
  // Two Sum -> 3Sum -> Subarray Sum Equals K
  {
    precursorIds: ['code_1'],
    topic: 'Arrays & Two Pointers',
    difficulty: 'Medium',
    targetLevel: 2,
    title: '3Sum (Unique Triplets)',
    acceptanceRate: '64%',
    companies: ['Google', 'Amazon', 'Meta', 'Microsoft', 'Bloomberg'],
    levelUpRationale: 'You mastered two-element hash lookups in Two Sum! We are leveling you up to 3Sum, which requires sorting and bidirectional two-pointers to find all unique triplets summing to zero while suppressing duplicates.',
    description: `Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      {
        input: 'nums = [-1, 0, 1, 2, -1, -4]',
        output: '[[-1, -1, 2], [-1, 0, 1]]',
        explanation: 'nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0.\nnums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0.\nDistinct triplets are [-1, -1, 2] and [-1, 0, 1].',
      },
      {
        input: 'nums = [0, 1, 1]',
        output: '[]',
        explanation: 'The only possible triplet does not sum up to 0.',
      },
      {
        input: 'nums = [0, 0, 0]',
        output: '[[0, 0, 0]]',
        explanation: 'The only possible triplet sums up to 0.',
      },
    ],
    constraints: [
      '3 <= nums.length <= 3000',
      '-10^5 <= nums[i] <= 10^5',
    ],
    starterTemplates: {
      python: `def three_sum(nums):
    # Sort array first, then use two pointers
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l + 1]:
                    l += 1
                while l < r and nums[r] == nums[r - 1]:
                    r -= 1
                l += 1
                r -= 1
    return res
`,
      javascript: `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum < 0) l++;
      else if (sum > 0) r--;
      else {
        res.push([nums[i], nums[l], nums[r]]);
        while (l < r && nums[l] === nums[l + 1]) l++;
        while (l < r && nums[r] === nums[r - 1]) r--;
        l++;
        r--;
      }
    }
  }
  return res;
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        for (int i = 0; i < (int)nums.size() - 2; i++) {
            if (i > 0 && nums[i] == nums[i-1]) continue;
            int l = i + 1, r = nums.size() - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else {
                    res.push_back({nums[i], nums[l], nums[r]});
                    while (l < r && nums[l] == nums[l+1]) l++;
                    while (l < r && nums[r] == nums[r-1]) r--;
                    l++; r--;
                }
            }
        }
        return res;
    }
};`,
      java: `import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else {
                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                }
            }
        }
        return res;
    }
}`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 'nums = [-1, 0, 1, 2, -1, -4]',
        args: [[-1, 0, 1, 2, -1, -4]],
        expectedOutput: [[-1, -1, 2], [-1, 0, 1]],
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 'nums = [0, 1, 1]',
        args: [[0, 1, 1]],
        expectedOutput: [],
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 'nums = [0, 0, 0]',
        args: [[0, 0, 0]],
        expectedOutput: [[0, 0, 0]],
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 'nums = [-2, 0, 1, 1, 2]',
        args: [[-2, 0, 1, 1, 2]],
        expectedOutput: [[-2, 0, 2], [-2, 1, 1]],
        isHidden: true,
      },
    ],
    optimalComplexity: { time: 'O(n^2)', space: 'O(1) extra space (ignoring output)' },
    hints: [
      'Sorting the array in O(n log n) enables bidirectional two-pointers.',
      'Remember to skip duplicate elements for both the outer loop and the inner two pointers to avoid repeat triplets.',
    ],
  },

  // Valid Palindrome -> Longest Palindromic Substring
  {
    precursorIds: ['code_2'],
    topic: 'Strings & Dynamic Programming',
    difficulty: 'Medium',
    targetLevel: 2,
    title: 'Longest Palindromic Substring',
    acceptanceRate: '56%',
    companies: ['Amazon', 'Microsoft', 'Adobe', 'Uber', 'Paytm'],
    levelUpRationale: 'You verified palindromes in O(n) with Valid Palindrome. Leveling up to finding the longest palindromic substring using Expand Around Center or 2D Dynamic Programming.',
    description: `Given a string \`s\`, return *the longest palindromic substring* in \`s\`.`,
    examples: [
      {
        input: 's = "babad"',
        output: '"bab"',
        explanation: '"aba" is also a valid answer.',
      },
      {
        input: 's = "cbbd"',
        output: '"bb"',
        explanation: '"bb" is the longest palindromic substring.',
      },
    ],
    constraints: ['1 <= s.length <= 1000', 's consists of only digits and English letters.'],
    starterTemplates: {
      python: `def longest_palindrome(s):
    # Expand around center technique
    if not s:
        return ""
    start, max_len = 0, 1
    def expand(l, r):
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
        return r - l - 1

    for i in range(len(s)):
        len1 = expand(i, i)
        len2 = expand(i, i + 1)
        cur_len = max(len1, len2)
        if cur_len > max_len:
            max_len = cur_len
            start = i - (cur_len - 1) // 2

    return s[start:start + max_len]
`,
      javascript: `function longestPalindrome(s) {
  if (!s || s.length <= 1) return s;
  let start = 0, maxLen = 1;

  function expand(l, r) {
    while (l >= 0 && r < s.length && s[l] === s[r]) {
      l--;
      r++;
    }
    return r - l - 1;
  }

  for (let i = 0; i < s.length; i++) {
    const len1 = expand(i, i);
    const len2 = expand(i, i + 1);
    const cur = Math.max(len1, len2);
    if (cur > maxLen) {
      maxLen = cur;
      start = i - Math.floor((cur - 1) / 2);
    }
  }

  return s.substring(start, start + maxLen);
}`,
      cpp: `#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    string longestPalindrome(string s) {
        if (s.empty()) return "";
        int start = 0, maxLen = 1;
        auto expand = [&](int l, int r) {
            while (l >= 0 && r < s.length() && s[l] == s[r]) {
                l--; r++;
            }
            return r - l - 1;
        };
        for (int i = 0; i < s.length(); i++) {
            int len1 = expand(i, i);
            int len2 = expand(i, i + 1);
            int cur = max(len1, len2);
            if (cur > maxLen) {
                maxLen = cur;
                start = i - (cur - 1) / 2;
            }
        }
        return s.substr(start, maxLen);
    }
};`,
      java: `class Solution {
    public String longestPalindrome(String s) {
        if (s == null || s.length() < 1) return "";
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            int len1 = expand(s, i, i);
            int len2 = expand(s, i, i + 1);
            int len = Math.max(len1, len2);
            if (len > end - start) {
                start = i - (len - 1) / 2;
                end = i + len / 2;
            }
        }
        return s.substring(start, end + 1);
    }
    private int expand(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;
    }
}`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 's = "babad"',
        args: ['babad'],
        expectedOutput: 'bab',
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 's = "cbbd"',
        args: ['cbbd'],
        expectedOutput: 'bb',
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 's = "a"',
        args: ['a'],
        expectedOutput: 'a',
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 's = "racecar"',
        args: ['racecar'],
        expectedOutput: 'racecar',
        isHidden: true,
      },
    ],
    optimalComplexity: { time: 'O(n^2)', space: 'O(1)' },
    hints: ['Consider expanding around every possible center (both odd and even length centers).'],
  },

  // Maximum Subarray -> Maximum Product Subarray
  {
    precursorIds: ['code_3'],
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    targetLevel: 3,
    title: 'Maximum Product Subarray',
    acceptanceRate: '48%',
    companies: ['Amazon', 'Google', 'Morgan Stanley', 'LinkedIn'],
    levelUpRationale: 'Kadane\'s sum algorithm only needs to drop negative sums. In Maximum Product Subarray, multiplying two negative numbers creates a positive product, requiring simultaneous tracking of max and min running products!',
    description: `Given an integer array \`nums\`, find a subarray that has the largest product, and return *the product*.

The test cases are generated so that the answer will fit in a **32-bit** integer.`,
    examples: [
      {
        input: 'nums = [2, 3, -2, 4]',
        output: '6',
        explanation: '[2, 3] has the largest product 6.',
      },
      {
        input: 'nums = [-2, 0, -1]',
        output: '0',
        explanation: 'The result cannot be 2, because [-2, -1] is not a subarray.',
      },
    ],
    constraints: ['1 <= nums.length <= 2 * 10^4', '-10 <= nums[i] <= 10'],
    starterTemplates: {
      python: `def max_product(nums):
    res = max(nums)
    cur_min, cur_max = 1, 1
    for n in nums:
        if n == 0:
            cur_min, cur_max = 1, 1
            continue
        tmp = cur_max * n
        cur_max = max(n * cur_max, n * cur_min, n)
        cur_min = min(tmp, n * cur_min, n)
        res = max(res, cur_max)
    return res
`,
      javascript: `function maxProduct(nums) {
  let res = Math.max(...nums);
  let curMin = 1, curMax = 1;
  for (const n of nums) {
    if (n === 0) {
      curMin = 1;
      curMax = 1;
      continue;
    }
    const temp = curMax * n;
    curMax = Math.max(n * curMax, n * curMin, n);
    curMin = Math.min(temp, n * curMin, n);
    res = Math.max(res, curMax);
  }
  return res;
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int res = *max_element(nums.begin(), nums.end());
        int curMin = 1, curMax = 1;
        for (int n : nums) {
            if (n == 0) {
                curMin = 1; curMax = 1;
                continue;
            }
            int tmp = curMax * n;
            curMax = max({n * curMax, n * curMin, n});
            curMin = min({tmp, n * curMin, n});
            res = max(res, curMax);
        }
        return res;
    }
};`,
      java: `class Solution {
    public int maxProduct(int[] nums) {
        int res = nums[0];
        int curMin = 1, curMax = 1;
        for (int n : nums) {
            if (n == 0) {
                curMin = 1; curMax = 1;
                res = Math.max(res, 0);
                continue;
            }
            int tmp = curMax * n;
            curMax = Math.max(n, Math.max(tmp, curMin * n));
            curMin = Math.min(n, Math.min(tmp, curMin * n));
            res = Math.max(res, curMax);
        }
        return res;
    }
}`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 'nums = [2, 3, -2, 4]',
        args: [[2, 3, -2, 4]],
        expectedOutput: 6,
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 'nums = [-2, 0, -1]',
        args: [[-2, 0, -1]],
        expectedOutput: 0,
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 'nums = [-2, 3, -4]',
        args: [[-2, 3, -4]],
        expectedOutput: 24,
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 'nums = [-2]',
        args: [[-2]],
        expectedOutput: -2,
        isHidden: true,
      },
    ],
    optimalComplexity: { time: 'O(n)', space: 'O(1)' },
    hints: ['Notice that negative numbers flip the maximum product to minimum, and minimum product to maximum.'],
  },

  // Valid Parentheses -> Daily Temperatures (Monotonic Stack)
  {
    precursorIds: ['code_4'],
    topic: 'Stacks & Monotonic Queues',
    difficulty: 'Medium',
    targetLevel: 2,
    title: 'Daily Temperatures (Next Greater Element)',
    acceptanceRate: '67%',
    companies: ['Amazon', 'Apple', 'Meta', 'Netflix'],
    levelUpRationale: 'You conquered balanced parentheses with a simple stack. We are leveling you up to a Monotonic Decreasing Stack, which finds the next greater element in linear O(n) time.',
    description: `Given an array of integers \`temperatures\` represents the daily temperatures, return *an array* \`answer\` *such that* \`answer[i]\` *is the number of days you have to wait after the* \`i\`th *day to get a warmer temperature*. If there is no future day for which this is possible, keep \`answer[i] == 0\` instead.`,
    examples: [
      {
        input: 'temperatures = [73, 74, 75, 71, 69, 72, 76, 73]',
        output: '[1, 1, 4, 2, 1, 1, 0, 0]',
        explanation: 'At index 0 (73), day 1 is 74 (wait 1 day). At index 2 (75), day 6 is 76 (wait 4 days).',
      },
      {
        input: 'temperatures = [30, 40, 50, 60]',
        output: '[1, 1, 1, 0]',
        explanation: 'Each day is warmer than the previous, except the last day.',
      },
    ],
    constraints: ['1 <= temperatures.length <= 10^5', '30 <= temperatures[i] <= 100'],
    starterTemplates: {
      python: `def daily_temperatures(temperatures):
    res = [0] * len(temperatures)
    stack = []  # stores pairs: [temp, index]
    for i, t in enumerate(temperatures):
        while stack and t > stack[-1][0]:
            stack_t, stack_i = stack.pop()
            res[stack_i] = i - stack_i
        stack.append((t, i))
    return res
`,
      javascript: `function dailyTemperatures(temperatures) {
  const res = new Array(temperatures.length).fill(0);
  const stack = []; // indices
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const prevIdx = stack.pop();
      res[prevIdx] = i - prevIdx;
    }
    stack.push(i);
  }
  return res;
}`,
      cpp: `#include <vector>
#include <stack>
using namespace std;

class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        vector<int> res(temperatures.size(), 0);
        stack<int> s;
        for (int i = 0; i < temperatures.size(); i++) {
            while (!s.empty() && temperatures[i] > temperatures[s.top()]) {
                int prev = s.top();
                s.pop();
                res[prev] = i - prev;
            }
            s.push(i);
        }
        return res;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int[] res = new int[temperatures.length];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < temperatures.length; i++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int prev = stack.pop();
                res[prev] = i - prev;
            }
            stack.push(i);
        }
        return res;
    }
}`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 'temperatures = [73, 74, 75, 71, 69, 72, 76, 73]',
        args: [[73, 74, 75, 71, 69, 72, 76, 73]],
        expectedOutput: [1, 1, 4, 2, 1, 1, 0, 0],
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 'temperatures = [30, 40, 50, 60]',
        args: [[30, 40, 50, 60]],
        expectedOutput: [1, 1, 1, 0],
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 'temperatures = [30, 60, 90]',
        args: [[30, 60, 90]],
        expectedOutput: [1, 1, 0],
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 'temperatures = [89, 62, 70, 58, 47, 47, 46, 76, 100, 70]',
        args: [[89, 62, 70, 58, 47, 47, 46, 76, 100, 70]],
        expectedOutput: [8, 1, 5, 4, 3, 2, 1, 1, 0, 0],
        isHidden: true,
      },
    ],
    optimalComplexity: { time: 'O(n)', space: 'O(n)' },
    hints: ['Store indices of elements in the stack. When you encounter a temperature higher than top, calculate the distance.'],
  },

  // Coin Change -> Trapping Rain Water (Hard level up)
  {
    precursorIds: ['code_5'],
    topic: 'Two Pointers & Dynamic Programming',
    difficulty: 'Hard',
    targetLevel: 4,
    title: 'Trapping Rain Water',
    acceptanceRate: '61%',
    companies: ['Google', 'Goldman Sachs', 'Amazon', 'Bloomberg', 'Microsoft'],
    levelUpRationale: 'You proved your problem solving on 1D DP in Coin Change. Leveling up to Trapping Rain Water, one of the most prestigious Big Tech interview questions, solvable in O(n) time and O(1) space with two pointers!',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      {
        input: 'height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]',
        output: '6',
        explanation: 'The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.',
      },
      {
        input: 'height = [4, 2, 0, 3, 2, 5]',
        output: '9',
        explanation: 'Traps 9 units of water between pillars.',
      },
    ],
    constraints: ['n == height.length', '1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    starterTemplates: {
      python: `def trap(height):
    if not height:
        return 0
    l, r = 0, len(height) - 1
    left_max, right_max = height[l], height[r]
    water = 0
    while l < r:
        if left_max < right_max:
            l += 1
            left_max = max(left_max, height[l])
            water += left_max - height[l]
        else:
            r -= 1
            right_max = max(right_max, height[r])
            water += right_max - height[r]
    return water
`,
      javascript: `function trap(height) {
  if (!height || height.length === 0) return 0;
  let l = 0, r = height.length - 1;
  let leftMax = height[l], rightMax = height[r];
  let water = 0;
  while (l < r) {
    if (leftMax < rightMax) {
      l++;
      leftMax = Math.max(leftMax, height[l]);
      water += leftMax - height[l];
    } else {
      r--;
      rightMax = Math.max(rightMax, height[r]);
      water += rightMax - height[r];
    }
  }
  return water;
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        if (height.empty()) return 0;
        int l = 0, r = height.size() - 1;
        int leftMax = height[l], rightMax = height[r];
        int water = 0;
        while (l < r) {
            if (leftMax < rightMax) {
                l++;
                leftMax = max(leftMax, height[l]);
                water += leftMax - height[l];
            } else {
                r--;
                rightMax = max(rightMax, height[r]);
                water += rightMax - height[r];
            }
        }
        return water;
    }
};`,
      java: `class Solution {
    public int trap(int[] height) {
        if (height == null || height.length == 0) return 0;
        int l = 0, r = height.length - 1;
        int leftMax = height[l], rightMax = height[r];
        int water = 0;
        while (l < r) {
            if (leftMax < rightMax) {
                l++;
                leftMax = Math.max(leftMax, height[l]);
                water += leftMax - height[l];
            } else {
                r--;
                rightMax = Math.max(rightMax, height[r]);
                water += rightMax - height[r];
            }
        }
        return water;
    }
}`,
    },
    testCases: [
      {
        id: 1,
        inputDisplay: 'height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]',
        args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]],
        expectedOutput: 6,
        isHidden: false,
      },
      {
        id: 2,
        inputDisplay: 'height = [4, 2, 0, 3, 2, 5]',
        args: [[4, 2, 0, 3, 2, 5]],
        expectedOutput: 9,
        isHidden: false,
      },
      {
        id: 3,
        inputDisplay: 'height = [3, 0, 2, 0, 4]',
        args: [[3, 0, 2, 0, 4]],
        expectedOutput: 7,
        isHidden: false,
      },
      {
        id: 4,
        inputDisplay: 'height = [5, 4, 1, 2]',
        args: [[5, 4, 1, 2]],
        expectedOutput: 1,
        isHidden: true,
      },
    ],
    optimalComplexity: { time: 'O(n)', space: 'O(1)' },
    hints: ['The water above index i is determined by min(max_left, max_right) - height[i]. Two pointers eliminate needing extra arrays.'],
  },
];

/**
 * Generate Next Coding Challenge based on student's solved history and current mastery
 */
export function generateNextCodingChallenge({ completedProblemId, solvedIds = [] }) {
  // Check direct progression rule
  if (completedProblemId) {
    const directMatch = CODING_LEVEL_UP_PROGRESSION.find(
      p => p.precursorIds.includes(completedProblemId) && !solvedIds.includes(p.id)
    );
    if (directMatch) {
      return {
        ...directMatch,
        id: directMatch.id || `gen_code_${Date.now()}`,
        isAutoGenerated: true,
      };
    }
  }

  // Find uncompleted candidate with highest relevance to student's level
  const solvedCount = solvedIds.length;
  let targetDiff = 'Easy';
  if (solvedCount >= 4) targetDiff = 'Hard';
  else if (solvedCount >= 2) targetDiff = 'Medium';

  const uncompleted = CODING_LEVEL_UP_PROGRESSION.filter(p => !solvedIds.includes(p.id));

  if (uncompleted.length > 0) {
    const candidate = uncompleted.find(p => p.difficulty === targetDiff) || uncompleted[0];
    return {
      ...candidate,
      id: candidate.id || `gen_code_${Date.now()}`,
      isAutoGenerated: true,
    };
  }

  // Fallback parametric challenge generator: Subarray Sum Equals K
  return {
    id: `gen_code_${Date.now()}`,
    isAutoGenerated: true,
    title: 'Subarray Sum Equals K',
    topic: 'Prefix Sum & Hash Map',
    difficulty: 'Medium',
    targetLevel: 3,
    acceptanceRate: '52%',
    companies: ['Google', 'Meta', 'Amazon', 'Adobe'],
    levelUpRationale: 'Procedurally generated based on your cumulative mastery. This problem tests continuous prefix sum caching to solve frequency sub-problems in linear O(n) time.',
    description: `Given an array of integers \`nums\` and an integer \`k\`, return *the total number of subarrays whose sum equals to* \`k\`.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    examples: [
      { input: 'nums = [1, 1, 1], k = 2', output: '2', explanation: '[1, 1] at index 0-1 and index 1-2.' },
      { input: 'nums = [1, 2, 3], k = 3', output: '2', explanation: '[1, 2] and [3] both equal 3.' },
    ],
    constraints: ['1 <= nums.length <= 2 * 10^4', '-1000 <= nums[i] <= 1000', '-10^7 <= k <= 10^7'],
    starterTemplates: {
      python: `def subarray_sum(nums, k):
    res = 0
    cur_sum = 0
    prefix_map = {0: 1}
    for n in nums:
        cur_sum += n
        diff = cur_sum - k
        res += prefix_map.get(diff, 0)
        prefix_map[cur_sum] = prefix_map.get(cur_sum, 0) + 1
    return res
`,
      javascript: `function subarraySum(nums, k) {
  let count = 0, sum = 0;
  const map = new Map();
  map.set(0, 1);
  for (const n of nums) {
    sum += n;
    if (map.has(sum - k)) {
      count += map.get(sum - k);
    }
    map.set(sum, (map.get(sum) || 0) + 1);
  }
  return count;
}`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        int count = 0, sum = 0;
        unordered_map<int, int> mp;
        mp[0] = 1;
        for (int n : nums) {
            sum += n;
            if (mp.count(sum - k)) count += mp[sum - k];
            mp[sum]++;
        }
        return count;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int subarraySum(int[] nums, int k) {
        int count = 0, sum = 0;
        Map<Integer, Integer> map = new HashMap<>();
        map.put(0, 1);
        for (int n : nums) {
            sum += n;
            if (map.containsKey(sum - k)) {
                count += map.get(sum - k);
            }
            map.put(sum, map.getOrDefault(sum, 0) + 1);
        }
        return count;
    }
}`,
    },
    testCases: [
      { id: 1, inputDisplay: 'nums = [1, 1, 1], k = 2', args: [[1, 1, 1], 2], expectedOutput: 2, isHidden: false },
      { id: 2, inputDisplay: 'nums = [1, 2, 3], k = 3', args: [[1, 2, 3], 3], expectedOutput: 2, isHidden: false },
      { id: 3, inputDisplay: 'nums = [1, -1, 0], k = 0', args: [[1, -1, 0], 0], expectedOutput: 3, isHidden: false },
      { id: 4, inputDisplay: 'nums = [-1, -1, 1], k = 0', args: [[-1, -1, 1], 0], expectedOutput: 1, isHidden: true },
    ],
    optimalComplexity: { time: 'O(n)', space: 'O(n)' },
    hints: ['If prefix_sum[j] - prefix_sum[i] == k, then the sum of subarray between i and j is k.'],
  };
}

/**
 * Generate Targeted MCQ Questions based on student's weak areas and performance level
 */
export function generateTargetedMcqQuestions({ weakTopics = [], targetDifficulty = 'Medium', count = 3 }) {
  const POOL = [
    {
      topic: 'DBMS',
      difficulty: 'Medium',
      question: 'In PostgreSQL and ACID transaction management, what phenomenon is prevented by REPEATABLE READ isolation that is permitted under READ COMMITTED?',
      options: [
        'Dirty Read',
        'Non-Repeatable Read (Fuzzy Read)',
        'Phantom Read',
        'Deadlock Condition',
      ],
      correct: 1,
      explanation: 'Under READ COMMITTED, re-reading the same row can return modified data if another transaction committed in between. REPEATABLE READ takes a transaction-level snapshot, guaranteeing reading the identical data on repeat queries.',
    },
    {
      topic: 'DSA',
      difficulty: 'Medium',
      question: 'What is the tightest worst-case time complexity of finding the K-th smallest element in an unsorted array of size N using QuickSelect (Hoare Selection Algorithm)?',
      options: ['O(N)', 'O(N log N)', 'O(N^2)', 'O(K log N)'],
      correct: 2,
      explanation: 'While average time for QuickSelect is O(N) by halving the partition range, the absolute worst case (e.g. consistently picking the extremum as pivot) degrades to O(N^2). IntroSelect guarantees O(N) worst case.',
    },
    {
      topic: 'OS',
      difficulty: 'Hard',
      question: 'Which of the following conditions is an essential requirement for deadlock to occur according to Coffman conditions, but can be prevented by enforcing strict linear resource ordering?',
      options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait'],
      correct: 3,
      explanation: 'Circular Wait can be strictly prevented if all system resources are assigned an integer index and processes are restricted to requesting resources only in strictly ascending numerical order.',
    },
    {
      topic: 'Networks',
      difficulty: 'Medium',
      question: 'During a TCP 3-Way Handshake, if Client sends SYN(seq=100), what exact ACK number and flags does Server respond with in its SYN-ACK packet?',
      options: [
        'SYN-ACK with seq=300, ack=100',
        'SYN-ACK with seq=300, ack=101',
        'SYN-ACK with seq=100, ack=101',
        'ACK with seq=101, ack=301',
      ],
      correct: 1,
      explanation: 'The server creates its own initial sequence number (e.g. 300) and acknowledges the client SYN by setting ACK number to client_seq + 1 (100 + 1 = 101).',
    },
    {
      topic: 'React',
      difficulty: 'Medium',
      question: 'In React 18 & 19 concurrent mode, what is the primary architectural difference between useDeferredValue and standard debounce?',
      options: [
        'useDeferredValue is tied to browser setTimeout while debounce is not',
        'useDeferredValue is deeply integrated with React scheduler and renders immediately after current urgent work finishes, without arbitrary millisecond delays',
        'debounce halts all virtual DOM reconciliation while useDeferredValue does not',
        'useDeferredValue is purely synchronous and runs before user input',
      ],
      correct: 1,
      explanation: 'useDeferredValue does not use fixed timeout delays. It lets urgent user keystrokes render immediately and yields deferred updates as soon as the main thread is idle, ensuring zero lag.',
    },
  ];

  // Filter or prioritize based on weak topics
  let candidates = POOL;
  if (weakTopics.length > 0) {
    const matched = POOL.filter(q => weakTopics.includes(q.topic));
    if (matched.length > 0) candidates = matched;
  }

  // Shuffle and pick requested count
  const shuffled = [...candidates].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((q, idx) => ({
    ...q,
    id: `gen_mcq_${Date.now()}_${idx}`,
    isAutoGenerated: true,
  }));
}
