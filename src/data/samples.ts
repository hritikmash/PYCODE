import { SampleExample } from '../types';

export const SAMPLE_EXAMPLES: SampleExample[] = [
  {
    id: 'buggy-list-filter',
    title: 'Removing Evens from List (Buggy Loop)',
    description: 'Code with index skipping and conceptual question on list mutation during iteration',
    tag: 'Theory + Code',
    mode: 'both',
    code: `def remove_even_numbers(numbers):
    # Bug: mutating list while iterating over it causes skipped elements!
    for num in numbers:
        if num % 2 = 0:    # Syntax error: single '=' instead of '=='
            numbers.remove(num)
    return numbers

my_list = [1, 2, 2, 3, 4, 4, 5, 6]
result = remove_even_numbers(my_list)
print("Filtered list:" result)  # Syntax error: missing comma`,
    question: `Why does removing items from a list while iterating over it with a for-loop skip elements in Python, and what is the idiomatic pythonic alternative?`
  },
  {
    id: 'broken-fibonacci',
    title: 'Recursive Fibonacci with Recursion & Type Bugs',
    description: 'Off-by-one, missing base case edge, and TypeError in string concatenation',
    tag: 'Code Only',
    mode: 'code_only',
    code: `def fibonacci_series(n):
    if n <= 0:
        return "Input must be positive integer"
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    seq = [0, 1]
    for i in range(2, n):
        # Bug: out-of-bounds indexing or incorrect sum
        next_val = seq[i] + seq[i - 1]
        seq.append(next_val)
    
    print("Computed series of length: " + len(seq)) # TypeError: can only concatenate str to str
    return seq

print(fibonacci_series(6))`,
    question: ``
  },
  {
    id: 'decorator-concept',
    title: 'Python Decorators & @wraps Deep Dive',
    description: 'Conceptual exploration of first-class functions, closures, and wrappers',
    tag: 'Theory Only',
    mode: 'theory_only',
    code: ``,
    question: `How do decorators work under the hood in Python? Explain first-class functions, closures, why @functools.wraps is essential, and provide a practical timer decorator example.`
  },
  {
    id: 'dict-lambda-sort',
    title: 'Sorting List of Dictionaries with Lambda',
    description: 'Comparing sorted(), key parameter, lambda functions vs operator.itemgetter',
    tag: 'Theory + Code',
    mode: 'both',
    code: `students = [
    {"name": "Amina", "score": 88, "age": 20},
    {"name": "Liam", "score": 95, "age": 19},
    {"name": "Carlos", "score": 88, "age": 22},
    {"name": "Zoe", "score": 92, "age": 21}
]

# Sort primarily by score descending, then by age ascending
sorted_students = sorted(students, key=lamda s: (-s['score'], s['age'])) # Syntax error: typo in lamda

for student in sorted_students:
    print(f"{student['name']}: Score {student['score']}, Age {student['age']}")`,
    question: `What is the difference between sorted() and list.sort()? Why do we use a lambda function as the key parameter, and how does Python handle multi-key sorting tuples?`
  },
  {
    id: 'args-kwargs-unpacking',
    title: '*args and **kwargs Function Arguments',
    description: 'Understanding variable positional and keyword arguments unpacking',
    tag: 'Theory + Code',
    mode: 'both',
    code: `def build_user_profile(user_id, *args, **kwargs):
    profile = {"id": user_id}
    # Bug: incorrect dictionary update and tuple handling
    profile["tags"] = args
    profile.update(kwargs)
    
    # Bug: trying to unpack into print without formatting
    return "Profile created: " + profile

res = build_user_profile(101, "python", "backend", active=True, role="developer")
print(res)`,
    question: `What is the exact mechanism of *args and **kwargs in Python? How does argument unpacking work with the * and ** operators when calling functions?`
  }
];
