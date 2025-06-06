import { Button, Card, Icon, TextField } from '@vaadin/react-components';
import Exam from "Frontend/generated/com/howell/examvault/base/domain/Exam";
import { useState } from "react";
import { ExamService } from "Frontend/generated/endpoints";
import { ReadMoreModal } from 'Frontend/components/readMoreModal';
import { useNavigate } from 'react-router';
import { ConfirmationButton } from 'Frontend/components/confirmationButton';

export default function ExamsView() {

    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);


    return (<>
        <div className='flex flex-col items-center justify-center' style={{ height: '80vh', overflowY: 'auto' }}>
            <h2 className='text-center mt-xl m-s'>Browse Exams</h2>
            <div className='grid grid-cols-2' style={{ textAlign: 'center', width: '80vw', marginBotton: '1rem', marginLeft: 'auto', marginRight: 'auto' }}>
                <div className='grid grid-rows-2 justify-center'>
                    <TextField
                        label={'Search Exams'}
                        slot="prefix"
                        id='exam-search'
                        placeholder="Search by title..."
                        clear-button-visible
                        style={{ width: '40vw', marginTop: '1rem' }}>
                        <Icon slot="prefix" icon="vaadin:search" style={{ color: 'var(--lumo-contrast-50pct)' }}></Icon>
                    </TextField>
                    <TextField
                        label={'Uploaded By'}
                        slot="suffix"
                        id='uploadedby-search'
                        placeholder="Search by user..."
                        clear-button-visible
                        style={{ width: '20vw', marginTop: '1rem' }}>
                    </TextField>
                </div>
                <Button style={{ width: '5rem' }} className='m-auto' onClick={() => {
                    const searchTerm = (document.getElementById('exam-search') as HTMLInputElement).value.toLowerCase();
                    const uploadedByTerm = (document.getElementById('uploadedby-search') as HTMLInputElement).value.toLowerCase();
                    if (searchTerm.length > 0 || uploadedByTerm.length > 0) {
                        ExamService.searchExams(
                            searchTerm,
                            uploadedByTerm
                        ).then((value) => {
                            setExams((value ?? []).filter((exam) => exam !== undefined));
                        });
                    }
                }}>Search
                </Button>
            </div>
            <div className="flex flex-wrap gap-m items-start justify-center p-xl m-auto" style={{ width: 'inherit', height: '60vh', overflowY: 'auto'}}>
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

                            <div className="flex flex-row mt-m">
                                <Button onClick={() => navigate(`/exams/${exam.id}`)} theme="secondary" className="m-s">
                                    View Exam Details
                                </Button>
                                <ConfirmationButton
                                    action="Begin Exam"
                                    modalTitle="Attempt Exam"
                                    modalDescription={`Are you sure you want to attempt "${exam.title}"?`}
                                    buttonText="Attempt Exam"
                                    buttonClassName="m-s"
                                    buttonTheme="primary"
                                    onYes={() => {
                                        navigate(`/exams/${exam.id}/attempt`);
                                    }}
                                />
                            </div>
                        </Card>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', height:'100%', width: '100%' }}>
                        <p>Looking for exams? Search for exams using the search bar above</p>
                    </div>
                )}
            </div>
        </div >
    </>

    );
}