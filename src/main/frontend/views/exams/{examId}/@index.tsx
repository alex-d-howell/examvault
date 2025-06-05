import Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';
import { ExamService } from 'Frontend/generated/endpoints';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

export default function ProfileView() {
    const { examId } = useParams<{ examId: string }>();

    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (examId) {
            ExamService.getExamById(examId)
                .then(value => { setExam((value ?? null)) }) // Update the state with the fetched exams) // Ensure we handle null cases
                .finally(() => setLoading(false));
        }
    }, [examId]);

    if (loading) return <p>Loading Exam Details...</p>;
    if (!exam) return <p>Exam not found</p>;

    return (
        <div>
            <p>{exam?.title}</p>
            <p>{exam?.description}</p>
            <p>Uploaded By: {exam?.uploadedBy}</p>
            {exam?.questions ? (exam?.questions.map((question, idx) => (
                <div key={idx}>
                    <p>Question {idx + 1}: {question?.questionText}</p>
                    {/* Render options, answers, etc. as needed */}
                </div>
            ))) : <p>No questions available for this exam.</p>}


            {/* Render other fields as needed */}
        </div>
    );
}