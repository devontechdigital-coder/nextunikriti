'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';

const blankQuestion = () => ({
  questionText: '',
  options: ['', '', '', ''],
  correctAnswerIndex: 0,
  explanation: '',
});

export default function LessonQuizEditor({ lessonId }) {
  const [quiz, setQuiz] = useState(null);
  const [title, setTitle] = useState('Lesson Quiz');
  const [passingScore, setPassingScore] = useState(50);
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    let active = true;
    const loadQuiz = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/quizs', { params: { lessonId } });
        if (!active) return;
        const existingQuiz = res.data?.data?.[0] || null;
        setQuiz(existingQuiz);
        setTitle(existingQuiz?.title || 'Lesson Quiz');
        setPassingScore(existingQuiz?.passingScore ?? 50);
        setQuestions(existingQuiz?.questions?.length ? existingQuiz.questions : [blankQuestion()]);
        setIsEditing(Boolean(existingQuiz));
      } catch (error) {
        if (active) toast.error(error.response?.data?.error || 'Failed to load quiz');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadQuiz();
    return () => { active = false; };
  }, [lessonId]);

  const updateQuestion = (index, field, value) => {
    setQuestions((items) => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((items) => items.map((item, itemIndex) => (
      itemIndex === questionIndex
        ? { ...item, options: item.options.map((option, index) => (index === optionIndex ? value : option)) }
        : item
    )));
  };

  const handleSave = async () => {
    const cleanQuestions = questions
      .map((question) => ({
        ...question,
        questionText: question.questionText.trim(),
        options: question.options.map((option) => option.trim()).filter(Boolean),
        correctAnswerIndex: Number(question.correctAnswerIndex || 0),
        explanation: question.explanation?.trim() || '',
      }))
      .filter((question) => question.questionText && question.options.length >= 2);

    if (!title.trim()) { toast.error('Quiz title is required'); return; }
    if (!cleanQuestions.length) { toast.error('Add at least one valid question with two options'); return; }
    if (cleanQuestions.some((question) => question.correctAnswerIndex >= question.options.length)) {
      toast.error('Correct answer must match an available option');
      return;
    }

    setSaving(true);
    try {
      const payload = { lessonId, title: title.trim(), passingScore: Number(passingScore || 50), questions: cleanQuestions };
      const res = quiz?._id
        ? await axios.put(`/api/quizs/${quiz._id}`, payload)
        : await axios.post('/api/quizs', payload);
      setQuiz(res.data?.data || null);
      setQuestions(res.data?.data?.questions?.length ? res.data.data.questions : cleanQuestions);
      setIsEditing(true);
      toast.success('Quiz saved');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quiz?._id || !window.confirm('Delete this quiz?')) return;
    setSaving(true);
    try {
      await axios.delete(`/api/quizs/${quiz._id}`);
      setQuiz(null);
      setTitle('Lesson Quiz');
      setPassingScore(50);
      setQuestions([blankQuestion()]);
      setIsEditing(false);
      toast.success('Quiz deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete quiz');
    } finally {
      setSaving(false);
    }
  };

  if (!lessonId) return null;
  if (loading) return <div className="py-3"><Spinner size="sm" /> Loading quiz...</div>;

  if (!isEditing && !quiz?._id) {
    return (
      <div className="mt-3">
        <Button
          type="button"
          size="sm"
          variant="outline-primary"
          className="rounded-pill px-3"
          onClick={() => setIsEditing(true)}
        >
          Add Quiz
        </Button>
        <span className="small text-muted ms-2">Optional</span>
      </div>
    );
  }

  return (
    <Card className="border-0 bg-light mt-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="fw-bold">Quiz</div>
          <div className="d-flex gap-2">
            {!quiz?._id && <Button size="sm" variant="light" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>}
            {quiz?._id && <Button size="sm" variant="outline-danger" onClick={handleDelete} disabled={saving}>Delete Quiz</Button>}
          </div>
        </div>
        <Row className="g-3 mb-3">
          <Col md={8}>
            <Form.Control value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" />
          </Col>
          <Col md={4}>
            <Form.Control type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(e.target.value)} placeholder="Passing score %" />
          </Col>
        </Row>
        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="border rounded-3 p-3 mb-3 bg-white">
            <div className="d-flex justify-content-between gap-2 mb-2">
              <Form.Control
                value={question.questionText}
                onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                placeholder={`Question ${questionIndex + 1}`}
              />
              <Button
                type="button"
                variant="outline-danger"
                size="sm"
                onClick={() => setQuestions((items) => items.length === 1 ? [blankQuestion()] : items.filter((_, index) => index !== questionIndex))}
              >
                Remove
              </Button>
            </div>
            <Row className="g-2">
              {question.options.map((option, optionIndex) => (
                <Col md={6} key={optionIndex}>
                  <InputWithRadio
                    checked={Number(question.correctAnswerIndex) === optionIndex}
                    onCheck={() => updateQuestion(questionIndex, 'correctAnswerIndex', optionIndex)}
                    value={option}
                    onChange={(value) => updateOption(questionIndex, optionIndex, value)}
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                </Col>
              ))}
            </Row>
            <Form.Control
              className="mt-2"
              value={question.explanation || ''}
              onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
              placeholder="Explanation (optional)"
            />
          </div>
        ))}
        {questions.length === 0 && <Alert variant="light">No questions yet.</Alert>}
        <div className="d-flex justify-content-between">
          <Button type="button" variant="outline-primary" onClick={() => setQuestions((items) => [...items, blankQuestion()])}>Add Question</Button>
          <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size="sm" /> : 'Save Quiz'}</Button>
        </div>
      </Card.Body>
    </Card>
  );
}

function InputWithRadio({ checked, onCheck, value, onChange, placeholder }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <Form.Check type="radio" checked={checked} onChange={onCheck} />
      <Form.Control value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
