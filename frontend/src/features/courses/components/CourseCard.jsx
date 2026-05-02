import { Link } from 'react-router-dom';

const levelColors = {
  A1: 'bg-secondary-100 text-secondary-700',
  A2: 'bg-primary-100 text-primary-700',
  B1: 'bg-accent-100 text-accent-700',
  B2: 'bg-red-100 text-red-700',
};

const levelLabels = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
};

const CourseCard = ({ course }) => {
  const { id, title, level, short_description, price_inr, price_usd, duration_weeks, teacher_name, enrolled_count, thumbnail_url } = course;

  return (
    <Link to={`/courses/${id}`} className="card group hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative h-44 overflow-hidden bg-neutral-100">
        {thumbnail_url ? (
          <img
            src={thumbnail_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="font-display text-5xl font-bold text-primary-400">{level}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`badge ${levelColors[level] || 'bg-neutral-100 text-neutral-600'}`}>
            {level} — {levelLabels[level] || level}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-neutral-900 text-lg leading-snug group-hover:text-primary-700 transition-colors">
          {title}
        </h3>
        {short_description && (
          <p className="text-neutral-500 text-sm mt-2 line-clamp-2 leading-relaxed">{short_description}</p>
        )}

        <div className="mt-4 flex items-center gap-3 text-xs text-neutral-400">
          {teacher_name && <span>by {teacher_name}</span>}
          {duration_weeks && <span>•</span>}
          {duration_weeks && <span>{duration_weeks} weeks</span>}
          {enrolled_count > 0 && <span>• {enrolled_count} enrolled</span>}
        </div>

        <div className="mt-auto pt-4 border-t border-neutral-100 flex items-center justify-between">
          <div>
            {price_inr > 0 && (
              <p className="font-semibold text-neutral-900">
                ₹{Number(price_inr).toLocaleString('en-IN')}
                <span className="text-neutral-400 font-normal text-xs ml-1">/ {price_usd > 0 ? `$${price_usd}` : ''}</span>
              </p>
            )}
          </div>
          <span className="text-primary-600 text-sm font-medium group-hover:underline">View Course →</span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
