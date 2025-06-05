import { Button, Card } from '@vaadin/react-components';
import Exam from "Frontend/generated/com/howell/examvault/base/domain/Exam";
import { useEffect, useState } from "react";
import { ExamService } from "Frontend/generated/endpoints";
import { ReadMoreModal } from 'Frontend/components/readMoreModal';
import { useNavigate } from 'react-router';

export default function ExamsView() {

    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);

    async function fetchExams() {
        ExamService.getAllExams().then(value => {
            setExams((value ?? []).filter((exam): exam is Exam => exam !== undefined)); // Update the state with the fetched exams
        });
    };

    useEffect(() => {
        fetchExams();
    }, []);

    //Render the exams as cards
    //Profile Links in top right corner
    //Side Navigation with links to other views
    //Search bar at the top to search for exams by title or description

    return (<>
        <div>
            <div className='border-b' style={{ textAlign: 'center', height: '10vh' }}>
                <h2 className="text-xl font-bold pt-l m-m">This is the exams view!</h2>
                <p className="text-s text-secondary m">Browse and attempt exams created by other users.</p>
            </div>
            <div className="flex flex-wrap gap-m items-start justify-center p-xl m-auto" style={{ maxHeight: '61vh', overflowY: 'auto' }}>
                {exams.length > 0 ? (
                    exams.map((exam, idx) => (
                        <Card
                            key={idx}
                            className="flex flex-col p-m shadow-s"
                            style={{ height: '13rem', width: '20rem' }}
                        >
                            <div className="flex flex-col mb-s">
                                <span className="font-semibold text-l">{exam.title}</span>
                                <span className="text-s text-secondary mt-s">
                                    Uploaded By: {exam.uploadedBy}
                                </span>
                                <ReadMoreModal description={exam.description ? exam.description : ''} />
                            </div>

                            <div className="flex gap-s mt-m">
                                <Button onClick={() => navigate(`/exams/${exam.id}`)} theme="secondary" className="m-s">
                                    View Exam Details
                                </Button>
                                <Button onClick={() => navigate(`/exams/${exam.id}/attempt`)} theme="primary" className="m-s">
                                    Attempt Exam
                                </Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <p>No exams available. Search for exams using the search bar above.</p>
                )}
            </div>

        </div>
    </>

    );
}