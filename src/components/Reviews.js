'use client';
import { useState, useEffect } from 'react';
import Stars from './Stars';
import { loadReviews, submitReview, avgRating } from '@/lib/reviews';

export default function Reviews({ targetType, targetId, targetName }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [targetType, targetId]);

  async function load() {
    setLoading(true);
    const data = await loadReviews(targetType, targetId);
    setReviews(data);
    setLoading(false);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('الاسم مطلوب'); return; }
    if (rating < 1) { setError('اختر التقييم'); return; }
    setSubmitting(true);
    const res = await submitReview({
      targetType, targetId, targetName,
      reviewerName: name.trim(),
      reviewerPhone: phone.trim(),
      rating, comment: comment.trim(),
    });
    setSubmitting(false);
    if (!res.ok) { setError(res.error || 'تعذّر الإرسال'); return; }
    setName(''); setPhone(''); setRating(0); setComment('');
    setOpen(false);
    load();
  }

  const summary = avgRating(reviews);

  return (
    <div className="detail-section">
      <div className="detail-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>التقييمات والتعليقات</span>
        <button
          className="section-action"
          onClick={() => setOpen(true)}
          type="button"
          style={{ fontSize: 11.5 }}
        >
          ✎ أضف تقييمًا
        </button>
      </div>

      {loading ? (
        <div className="ol-empty-state" style={{ padding: 30 }}>
          <p>جارٍ التحميل...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="ol-empty-state" style={{ padding: 30 }}>
          <span className="em">⭐</span>
          <p>لا توجد تقييمات بعد — كن أول من يقيّم</p>
        </div>
      ) : (
        <>
          <div className="reviews-summary">
            <div className="reviews-avg">
              <div className="reviews-avg-num">{summary.avg}</div>
              <Stars value={Number(summary.avg)} size={14} />
              <div className="reviews-avg-lbl">{summary.count} تقييم</div>
            </div>
            <div className="reviews-bars">
              {[5, 4, 3, 2, 1].map((n, i) => (
                <div key={n} className="reviews-bar-row">
                  <span>{n}★</span>
                  <div className="reviews-bar-track">
                    <div
                      className="reviews-bar-fill"
                      style={{ width: `${summary.count ? (summary.bars[i] / summary.count) * 100 : 0}%` }}
                    />
                  </div>
                  <span style={{ minWidth: 18, textAlign: 'left' }}>{summary.bars[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {reviews.slice(0, 5).map((r) => (
            <div key={r.id} className="review-item">
              <div className="review-head">
                <div>
                  <div className="review-author">{r.reviewer_name}</div>
                  <Stars value={r.rating} size={13} />
                </div>
                <div className="review-date">
                  {new Date(r.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
              {r.comment && <p className="review-body">{r.comment}</p>}
            </div>
          ))}
        </>
      )}

      {open && (
        <div className="rate-modal-bg" onClick={() => setOpen(false)}>
          <div className="rate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rate-modal-handle" />
            <h3 className="rate-modal-title">قيّم تجربتك</h3>
            <p className="rate-modal-sub">{targetName}</p>

            <div className="rate-modal-stars">
              <Stars value={rating} size={38} onChange={setRating} />
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="new-service-field">
                <label className="new-service-label">اسمك <span className="req">*</span></label>
                <input className="new-service-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">رقم الهاتف</label>
                <input className="new-service-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">تعليقك</label>
                <textarea className="new-service-textarea" value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              {error && <div style={{ color: '#dc2626', fontSize: 12.5, fontWeight: 700 }}>{error}</div>}
              <button className="new-service-submit" type="submit" disabled={submitting}>
                {submitting ? '... جارٍ الإرسال' : 'نشر التقييم'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
