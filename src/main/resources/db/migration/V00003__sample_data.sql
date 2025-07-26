-- Insert sample exams
INSERT INTO exam (id, title, description, tags, uploaded_by, uploaded_at) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    'Java Fundamentals Quiz',
    'A comprehensive quiz covering basic Java programming concepts including variables, data types, control structures, and object-oriented programming principles.',
    ARRAY['java', 'programming', 'fundamentals', 'oop'],
    'instructor@examvault.com',
    NOW() - INTERVAL '30 days'
),
(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    'Database Design Principles',
    'Test your knowledge of database design principles, normalization, relationships, and SQL queries.',
    ARRAY['database', 'sql', 'design', 'normalization'],
    'dbadmin@examvault.com',
    NOW() - INTERVAL '20 days'
),
(
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    'Web Development Basics',
    'Introduction to web development covering HTML, CSS, JavaScript, and basic web architecture.',
    ARRAY['web', 'html', 'css', 'javascript', 'frontend'],
    'webdev@examvault.com',
    NOW() - INTERVAL '15 days'
),
(
    '550e8400-e29b-41d4-a716-446655440004'::UUID,
    'Python Data Structures',
    'Comprehensive coverage of Python data structures including lists, dictionaries, sets, and tuples.',
    ARRAY['python', 'data-structures', 'programming', 'algorithms'],
    'pythondev@examvault.com',
    NOW() - INTERVAL '10 days'
),
(
    '550e8400-e29b-41d4-a716-446655440005'::UUID,
    'React Fundamentals',
    'Learn the basics of React including components, props, state, and hooks.',
    ARRAY['react', 'javascript', 'frontend', 'components'],
    'reactdev@examvault.com',
    NOW() - INTERVAL '5 days'
);

-- Insert questions for Java Fundamentals Quiz
INSERT INTO question (id, exam_id, question_text, options, correct_answers, is_multiple_answers, explanation) VALUES
(
    '660e8400-e29b-41d4-a716-446655440001'::UUID,
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    'Which of the following is NOT a primitive data type in Java?',
    ARRAY['int', 'float', 'String', 'boolean'],
    ARRAY['String'],
    false,
    'String is a class in Java, not a primitive data type. The primitive data types are byte, short, int, long, float, double, char, and boolean.'
),
(
    '660e8400-e29b-41d4-a716-446655440002'::UUID,
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    'What are the main principles of Object-Oriented Programming? (Select all that apply)',
    ARRAY['Encapsulation', 'Inheritance', 'Polymorphism', 'Compilation', 'Abstraction'],
    ARRAY['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'],
    true,
    'The four main principles of OOP are Encapsulation, Inheritance, Polymorphism, and Abstraction. Compilation is not an OOP principle.'
),
(
    '660e8400-e29b-41d4-a716-446655440003'::UUID,
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    'Which keyword is used to create a subclass in Java?',
    ARRAY['extends', 'implements', 'inherits', 'super'],
    ARRAY['extends'],
    false,
    'The extends keyword is used to create a subclass that inherits from a parent class in Java.'
);

-- Insert questions for Database Design Principles
INSERT INTO question (id, exam_id, question_text, options, correct_answers, is_multiple_answers, explanation) VALUES
(
    '660e8400-e29b-41d4-a716-446655440004'::UUID,
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    'What is the purpose of database normalization?',
    ARRAY['To increase data redundancy', 'To reduce data redundancy and improve data integrity', 'To make queries slower', 'To increase storage space'],
    ARRAY['To reduce data redundancy and improve data integrity'],
    false,
    'Database normalization is the process of organizing data to reduce redundancy and improve data integrity.'
),
(
    '660e8400-e29b-41d4-a716-446655440005'::UUID,
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    'Which SQL commands are part of DDL (Data Definition Language)? (Select all that apply)',
    ARRAY['CREATE', 'SELECT', 'ALTER', 'UPDATE', 'DROP', 'INSERT'],
    ARRAY['CREATE', 'ALTER', 'DROP'],
    true,
    'DDL commands are used to define and modify database structure. CREATE, ALTER, and DROP are DDL commands, while SELECT, UPDATE, and INSERT are DML commands.'
);

-- Insert questions for Web Development Basics
INSERT INTO question (id, exam_id, question_text, options, correct_answers, is_multiple_answers, explanation) VALUES
(
    '660e8400-e29b-41d4-a716-446655440006'::UUID,
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    'Which HTML tag is used to create a hyperlink?',
    ARRAY['<link>', '<a>', '<href>', '<url>'],
    ARRAY['<a>'],
    false,
    'The <a> (anchor) tag is used to create hyperlinks in HTML. The href attribute specifies the destination URL.'
),
(
    '660e8400-e29b-41d4-a716-446655440007'::UUID,
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    'What does CSS stand for?',
    ARRAY['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
    ARRAY['Cascading Style Sheets'],
    false,
    'CSS stands for Cascading Style Sheets, which is used to style and layout web pages.'
),
(
    '660e8400-e29b-41d4-a716-446655440008'::UUID,
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    'Which JavaScript method is used to add an element to the end of an array?',
    ARRAY['push()', 'pop()', 'shift()', 'unshift()'],
    ARRAY['push()'],
    false,
    'The push() method adds one or more elements to the end of an array and returns the new length of the array.'
);

-- Insert questions for Python Data Structures
INSERT INTO question (id, exam_id, question_text, options, correct_answers, is_multiple_answers, explanation) VALUES
(
    '660e8400-e29b-41d4-a716-446655440009'::UUID,
    '550e8400-e29b-41d4-a716-446655440004'::UUID,
    'Which Python data structure is ordered and mutable?',
    ARRAY['tuple', 'set', 'list', 'frozenset'],
    ARRAY['list'],
    false,
    'Lists in Python are ordered collections that are mutable (can be changed after creation).'
),
(
    '660e8400-e29b-41d4-a716-446655440010'::UUID,
    '550e8400-e29b-41d4-a716-446655440004'::UUID,
    'Which of the following are characteristics of Python dictionaries? (Select all that apply)',
    ARRAY['Ordered (Python 3.7+)', 'Mutable', 'Allow duplicate keys', 'Key-value pairs'],
    ARRAY['Ordered (Python 3.7+)', 'Mutable', 'Key-value pairs'],
    true,
    'Python dictionaries are ordered (as of Python 3.7), mutable, store key-value pairs, but do not allow duplicate keys.'
);

-- Insert questions for React Fundamentals
INSERT INTO question (id, exam_id, question_text, options, correct_answers, is_multiple_answers, explanation) VALUES
(
    '660e8400-e29b-41d4-a716-446655440011'::UUID,
    '550e8400-e29b-41d4-a716-446655440005'::UUID,
    'What is JSX in React?',
    ARRAY['A separate templating language', 'JavaScript XML syntax extension', 'A CSS framework', 'A build tool'],
    ARRAY['JavaScript XML syntax extension'],
    false,
    'JSX (JavaScript XML) is a syntax extension for JavaScript that allows you to write HTML-like code within JavaScript.'
),
(
    '660e8400-e29b-41d4-a716-446655440012'::UUID,
    '550e8400-e29b-41d4-a716-446655440005'::UUID,
    'Which React hooks are used for state management? (Select all that apply)',
    ARRAY['useState', 'useEffect', 'useReducer', 'useMemo', 'useContext'],
    ARRAY['useState', 'useReducer', 'useContext'],
    true,
    'useState, useReducer, and useContext are primarily used for state management in React components.'
);

-- Create sample exam attempts
INSERT INTO exam_attempt (id, user_email, exam_id, start_time, end_time, number_correct) VALUES
(
    '770e8400-e29b-41d4-a716-446655440001'::UUID,
    'student1@university.edu',
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '45 minutes',
    2
),
(
    '770e8400-e29b-41d4-a716-446655440002'::UUID,
    'student2@university.edu',
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days' + INTERVAL '38 minutes',
    3
),
(
    '770e8400-e29b-41d4-a716-446655440003'::UUID,
    'student1@university.edu',
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '30 minutes',
    1
);

-- Insert sample answers (FIXED to use exam_attempt_id correctly)
INSERT INTO answer (exam_attempt_id, question_id, answer_choices, is_correct) VALUES
-- Attempt 1 answers (student1 on Java quiz)
('770e8400-e29b-41d4-a716-446655440001'::UUID, '660e8400-e29b-41d4-a716-446655440001'::UUID, ARRAY['String'], true),
('770e8400-e29b-41d4-a716-446655440001'::UUID, '660e8400-e29b-41d4-a716-446655440002'::UUID, ARRAY['Encapsulation', 'Inheritance'], false),
('770e8400-e29b-41d4-a716-446655440001'::UUID, '660e8400-e29b-41d4-a716-446655440003'::UUID, ARRAY['extends'], true),

-- Attempt 2 answers (student2 on Java quiz - perfect score)
('770e8400-e29b-41d4-a716-446655440002'::UUID, '660e8400-e29b-41d4-a716-446655440001'::UUID, ARRAY['String'], true),
('770e8400-e29b-41d4-a716-446655440002'::UUID, '660e8400-e29b-41d4-a716-446655440002'::UUID, ARRAY['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'], true),
('770e8400-e29b-41d4-a716-446655440002'::UUID, '660e8400-e29b-41d4-a716-446655440003'::UUID, ARRAY['extends'], true),

-- Attempt 3 answers (student1 on DB quiz)
('770e8400-e29b-41d4-a716-446655440003'::UUID, '660e8400-e29b-41d4-a716-446655440004'::UUID, ARRAY['To reduce data redundancy and improve data integrity'], true),
('770e8400-e29b-41d4-a716-446655440003'::UUID, '660e8400-e29b-41d4-a716-446655440005'::UUID, ARRAY['CREATE', 'UPDATE', 'DROP'], false);

-- Insert sample comments
INSERT INTO comment (exam_id, user_email, comment_string, exam_rating) VALUES
('550e8400-e29b-41d4-a716-446655440001'::UUID, 'student1@university.edu', 'Great quiz! Really helped me understand Java fundamentals better.', 5),
('550e8400-e29b-41d4-a716-446655440001'::UUID, 'student2@university.edu', 'Well-structured questions with good explanations.', 4),
('550e8400-e29b-41d4-a716-446655440002'::UUID, 'student1@university.edu', 'The database concepts were clearly explained.', 4),
('550e8400-e29b-41d4-a716-446655440003'::UUID, 'webstudent@college.edu', 'Perfect for beginners learning web development.', 5),
('550e8400-e29b-41d4-a716-446655440004'::UUID, 'pythonlearner@school.org', 'Good coverage of Python data structures.', 4),
('550e8400-e29b-41d4-a716-446655440005'::UUID, 'reactstudent@bootcamp.com', 'Excellent React fundamentals quiz with clear explanations.', 5);