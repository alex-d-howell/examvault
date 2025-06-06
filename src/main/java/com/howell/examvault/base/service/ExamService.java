package com.howell.examvault.base.service;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.domain.ExamRepository;
import com.howell.examvault.base.domain.Question;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

@AnonymousAllowed
@BrowserCallable
public class ExamService {

    private final ExamRepository examRepository;

    public ExamService(ExamRepository examRepository) {
        this.examRepository = examRepository;
    }

    public void saveExam(Exam exam) {
        // Create a new Exam object and save it to the repository
        examRepository.save(exam);
    }

    public void createSampleExams() {
        // Create and save sample exams\

        List<Question> questions = List.of(
                new Question("What is the capital of France?", List.of("Paris", "London", "Berlin", "Madrid"), "Paris", false),
                new Question("Which of the following is a programming language?", List.of("Python", "Snake", "Lizard", "Crocodile"), "Python", false),
                new Question("What is the chemical formula for water?", List.of("H2O", "CO2", "O2", "NaCl"), "H2O", false),
                new Question("Who painted the Mona Lisa?", List.of("Van Gogh", "Da Vinci", "Picasso", "Rembrandt"), "Da Vinci", false),
                new Question("What is the largest mammal?", List.of("Elephant", "Blue Whale", "Giraffe", "Hippopotamus"), "Blue Whale", false),
                new Question("What is the speed of light?", List.of("299,792 km/s", "150,000 km/s", "300,000 km/s", "1,000,000 km/s"), "299,792 km/s", false),
                new Question("What is the main ingredient in guacamole?", List.of("Avocado", "Tomato", "Onion", "Pepper"), "Avocado", false),
                new Question("What is the largest planet in our solar system?", List.of("Earth", "Mars", "Jupiter", "Saturn"), "Jupiter", false),
                new Question("Which element has the chemical symbol 'O'?", List.of("Oxygen", "Gold", "Silver", "Hydrogen"), "Oxygen", false),
                new Question("What is the capital of Japan?", List.of("Tokyo", "Seoul", "Beijing", "Bangkok"), "Tokyo", false),
                new Question("What is the boiling point of water?", List.of("100°C", "0°C", "50°C", "200°C"), "100°C", false),
                new Question("Who wrote 'Romeo and Juliet'?", List.of("Shakespeare", "Hemingway", "Tolkien", "Austen"), "Shakespeare", false),
                new Question("What is the largest continent?", List.of("Asia", "Africa", "North America", "South America"), "Asia", false),
                new Question("What is the currency of the United States?", List.of("Dollar", "Euro", "Pound", "Yen"), "Dollar", false),
                new Question("What is the primary language spoken in Brazil?", List.of("Portuguese", "Spanish", "English", "French"), "Portuguese", false),
                new Question("What is the smallest country in the world?", List.of("Vatican City", "Monaco", "San Marino", "Liechtenstein"), "Vatican City", false),
                new Question("What is the main ingredient in sushi?", List.of("Rice", "Fish", "Seaweed", "Vegetables"), "Rice", false),
                new Question("What is the capital of Italy?", List.of("Rome", "Venice", "Florence", "Milan"), "Rome", false),
                new Question("What is the largest ocean on Earth?", List.of("Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"), "Pacific Ocean", false),
                new Question("What is the chemical symbol for gold?", List.of("Au", "Ag", "Fe", "Pb"), "Au", false),
                new Question("Who discovered penicillin?", List.of("Alexander Fleming", "Marie Curie", "Albert Einstein", "Isaac Newton"), "Alexander Fleming", false),
                new Question("What is the largest desert in the world?", List.of("Sahara Desert", "Gobi Desert", "Kalahari Desert", "Atacama Desert"), "Sahara Desert", false),
                new Question("What is the main ingredient in hummus?", List.of("Chickpeas", "Lentils", "Beans", "Peas"), "Chickpeas", false),
                new Question("What is the capital of Canada?", List.of("Ottawa", "Toronto", "Vancouver", "Montreal"), "Ottawa", false),
                new Question("What is the largest organ in the human body?", List.of("Skin", "Liver", "Heart", "Brain"), "Skin", false),
                new Question("What is the primary language spoken in China?", List.of("Mandarin", "Cantonese", "English", "Japanese"), "Mandarin", false),
                new Question("What is the capital of Australia?", List.of("Canberra", "Sydney", "Melbourne", "Brisbane"), "Canberra", false),
                new Question("What is the chemical formula for carbon dioxide?", List.of("CO2", "O2", "H2O", "CH4"), "CO2", false),
                new Question("What is the largest animal on Earth?", List.of("Blue Whale", "Elephant", "Giraffe", "Great White Shark"), "Blue Whale", false),
                new Question("What is the main ingredient in pesto?", List.of("Basil", "Parsley", "Cilantro", "Mint"), "Basil", false),
                new Question("What is the capital of Germany?", List.of("Berlin", "Munich", "Frankfurt", "Hamburg"), "Berlin", false),
                new Question("What is the largest volcano in the world?", List.of("Mauna Loa", "Mount Everest", "Kilimanjaro", "Mount Fuji"), "Mauna Loa", false),
                new Question("What is the chemical symbol for silver?", List.of("Ag", "Au", "Fe", "Pb"), "Ag", false),
                new Question("Who painted the Sistine Chapel?", List.of("Michelangelo", "Raphael", "Da Vinci", "Van Gogh"), "Michelangelo", false),
                new Question("What is the largest river in the world?", List.of("Amazon River", "Nile River", "Yangtze River", "Mississippi River"), "Amazon River", false),
                new Question("What is the main ingredient in falafel?", List.of("Chickpeas", "Lentils", "Beans", "Peas"), "Chickpeas", false),
                new Question("What is the capital of Spain?", List.of("Madrid", "Barcelona", "Seville", "Valencia"), "Madrid", false),
                new Question("What is the largest island in the world?", List.of("Greenland", "New Guinea", "Borneo", "Madagascar"), "Greenland", false),
                new Question("What is the chemical formula for salt?", List.of("NaCl", "KCl", "CaCl2", "MgCl2"), "NaCl", false),
                new Question("Who wrote 'The Great Gatsby'?", List.of("F. Scott Fitzgerald", "Ernest Hemingway", "Mark Twain", "John Steinbeck"), "F. Scott Fitzgerald", false),
                new Question("What is the largest city in the world by population?", List.of("Tokyo", "Shanghai", "Delhi", "New York"), "Tokyo", false),
                new Question("What is the main ingredient in tzatziki?", List.of("Yogurt", "Cucumber", "Garlic", "Mint"), "Yogurt", false),
                new Question("What is the capital of Russia?", List.of("Moscow", "St. Petersburg", "Kazan", "Novosibirsk"), "Moscow", false),
                new Question("What is the largest country in the world by land area?", List.of("Russia", "Canada", "China", "United States"), "Russia", false),
                new Question("What is the chemical symbol for iron?", List.of("Fe", "Au", "Ag", "Pb"), "Fe", false),
                new Question("Who wrote 'Pride and Prejudice'?", List.of("Jane Austen", "Charlotte Brontë", "Emily Brontë", "Mary Shelley"), "Jane Austen", false),
                new Question("What is the largest lake in the world?", List.of("Caspian Sea", "Lake Superior", "Lake Victoria", "Lake Baikal"), "Caspian Sea", false),
                new Question("What is the main ingredient in kimchi?", List.of("Cabbage", "Carrot", "Radish", "Garlic"), "Cabbage", false),
                new Question("What is the capital of India?", List.of("New Delhi", "Mumbai", "Kolkata", "Chennai"), "New Delhi", false),
                new Question("What is the largest forest in the world?", List.of("Amazon Rainforest", "Taiga", "Congo Rainforest", "Boreal Forest"), "Amazon Rainforest", false),
                new Question("What is the chemical formula for methane?", List.of("CH4", "CO2", "H2O", "C2H6"), "CH4", false),
                new Question("Who discovered the theory of relativity?", List.of("Albert Einstein", "Isaac Newton", "Galileo Galilei", "Niels Bohr"), "Albert Einstein", false),
                new Question("What is the largest coral reef system in the world?", List.of("Great Barrier Reef", "Belize Barrier Reef", "Red Sea Coral Reef", "New Caledonian Barrier Reef"), "Great Barrier Reef", false),
                new Question("What is the main ingredient in curry?", List.of("Spices", "Rice", "Meat", "Vegetables"), "Spices", false),
                new Question("What is the capital of Egypt?", List.of("Cairo", "Alexandria", "Giza", "Luxor"), "Cairo", false),
                new Question("What is the largest mountain range in the world?", List.of("Himalayas", "Andes", "Rocky Mountains", "Alps"), "Himalayas", false),
                new Question("What is the chemical symbol for potassium?", List.of("K", "Na", "Ca", "Mg"), "K", false),
                new Question("Who wrote '1984'?", List.of("George Orwell", "Aldous Huxley", "Ray Bradbury", "F. Scott Fitzgerald"), "George Orwell", false),
                new Question("What is the largest waterfall in the world?", List.of("Angel Falls", "Niagara Falls", "Victoria Falls", "Iguazu Falls"), "Angel Falls", false),
                new Question("What is the main ingredient in paella?", List.of("Rice", "Seafood", "Chicken", "Vegetables"), "Rice", false),
                new Question("What is the capital of South Africa?", List.of("Pretoria", "Cape Town", "Johannesburg", "Durban"), "Pretoria", false),
                new Question("What is the largest city in Africa?", List.of("Lagos", "Cairo", "Kinshasa", "Johannesburg"), "Lagos", false),
                new Question("What is the chemical symbol for calcium?", List.of("Ca", "Mg", "K", "Na"), "Ca", false),
                new Question("Who wrote 'The Catcher in the Rye'?", List.of("J.D. Salinger", "F. Scott Fitzgerald", "Ernest Hemingway", "Mark Twain"), "J.D. Salinger", false),
                new Question("What is the largest city in Europe?", List.of("Moscow", "London", "Berlin", "Paris"), "Moscow", false)
        );

        Exam examToAdd = new Exam("Ultimate Trivia Exam " + generateRandomCharSequence(5), generateRandomParagraph(16), questions, "Admin", new Timestamp(System.currentTimeMillis()));
        examRepository.save(examToAdd);
    }

    public void deleteAllExams() {
        // Delete all exams from the repository
        examRepository.deleteAll();
    }

    public List<Exam> getAllExams() {
        // Retrieve all exams from the repository
        return examRepository.findAll();
    }

    public Exam getExamById(UUID id) {
        // Retrieve a specific exam by its ID
        return examRepository.findById(id).orElse(null);
    }

    public void updateExam(Exam exam) {
        // Update an existing exam in the repository
        examRepository.save(exam);
    }

    public List<Exam> searchExams(String title, String uploadedBy) {
        // Search for exams by a keyword in the title or description
        if (title == null || title.isEmpty()) {
            title = "";
        }
        if (uploadedBy == null || uploadedBy.isEmpty()) {
            uploadedBy = "";
        }
        return examRepository.findByTitleContainingIgnoreCaseAndUploadedByContainingIgnoreCase(title, uploadedBy);
    }

    private String generateRandomParagraph(int length) {
        String ultimateTriviaSummary = "Ultimate Trivia is a comprehensive trivia exam designed to test your knowledge across various subjects. It includes questions on geography, history, science, art, and more. Each question is crafted to challenge your understanding and recall of important facts and concepts. The exam is suitable for individuals looking to assess their general knowledge or prepare for competitive quizzes. With a mix of easy and difficult questions, it provides a balanced challenge for all participants. Have fun~ \\n The random paragraph is just padding to test the length of the exam description. It is not part of the actual trivia content but serves to fill the space and ensure that the description meets the required length for testing purposes.";
        // Generate a random paragraph of specified length
        StringBuilder paragraph = new StringBuilder();
        paragraph.append(generateRandomCharSequence(length));
        for (int i = 0; i < length; i++) {
            paragraph.append("\\n").append(generateRandomCharSequence(length * 6));
        }

        ultimateTriviaSummary = ultimateTriviaSummary + "\\n" + paragraph.toString();
        return ultimateTriviaSummary;
    }

    private String generateRandomCharSequence(int length) {
        // Generate a random character sequence of specified length
        StringBuilder charSequence = new StringBuilder();
        for (int i = 0; i < length; i++) {
            charSequence.append((char) ('a' + Math.random() * 26));
        }
        return charSequence.toString();
    }

}
