interface ActivityItemProps {
  message: string;
  time: string;
  type: 'blue' | 'green' | 'orange' | 'purple';
}

export default function ActivityItem({ message, time, type }: ActivityItemProps) {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="flex items-start space-x-3">
      <div className={`w-2 h-2 ${colorMap[type]} rounded-full mt-2`}></div>
      <div>
        <p className="text-gray-900 font-medium">{message}</p>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
    </div>
  );
}