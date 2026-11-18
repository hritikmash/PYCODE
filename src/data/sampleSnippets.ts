import type { SampleSnippet } from '../types/pyfix';

export const SAMPLE_SNIPPETS: SampleSnippet[] = [
  {
    id: 'two-sum-bug',
    label: 'Two Sum IndexError',
    mode: 'beginner',
    query: 'Why does this Two Sum function throw an IndexError or return the wrong pair?',
    code: `def find_pair(nums, target):
    seen = {}
    for i in range(len(nums) + 1):
        complement = target - nums[i]
        if complement in seen:
            return [seen[complement], i]
        seen[nums[i]] = i
    return []

print(find_pair([2, 7, 11, 15], 9))`,
  },
  {
    id: 'mutable-default',
    label: 'Mutable Default Arg',
    mode: 'interview',
    query: 'Why do successive calls share items across separate user carts?',
    code: `def add_item(item, cart=[]):
    cart.append(item)
    return cart

alice_cart = add_item("keyboard")
bob_cart = add_item("mouse")
print("Alice:", alice_cart)
print("Bob:", bob_cart)`,
  },
  {
    id: 'dict-iteration',
    label: 'Dict Mutation RuntimeError',
    mode: 'beginner',
    query: 'Why does removing inactive users raise a RuntimeError during iteration?',
    code: `users = {"alice": True, "bob": False, "charlie": False, "diana": True}

for name, active in users.items():
    if not active:
        del users[name]

print(users)`,
  },
  {
    id: 'sliding-window',
    label: 'Max Subarray O(n^2) -> O(n)',
    mode: 'interview',
    query: 'Fix the off-by-one bug and optimize sliding window runtime complexity.',
    code: `def max_window_sum(arr, k):
    if len(arr) < k:
        return 0
    best = 0
    for i in range(len(arr) - k):
        window = sum(arr[i:i+k])
        if window > best:
            best = window
    return best

print(max_window_sum([2, 1, 5, 1, 3, 2], 3))`,
  },
];
