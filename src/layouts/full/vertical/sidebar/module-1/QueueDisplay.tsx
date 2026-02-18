import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Display' }];
// Sample queue data
const queueList = [
  { id: 1, number: 'P-001', type: 'priority' },
  { id: 2, number: 'R-002', type: 'regular' },
  { id: 3, number: 'R-003', type: 'regular' },
  { id: 4, number: 'P-004', type: 'priority' },
  { id: 5, number: 'R-005', type: 'regular' },
];

// Sample offices with their windows
const offices = [
  {
    name: 'Registration Office',
    windows: [
      { name: 'Window 1', number: 'P-001' },
      { name: 'Window 2', number: 'R-002' },
      { name: 'Window 3', number: null },
      { name: 'Window 4', number: null },
    ],
  },
  {
    name: 'Cashier',
    windows: [
      { name: 'Window 1', number: 'R-003' },
      { name: 'Window 2', number: null },
      { name: 'Window 3', number: null },
      { name: 'Window 4', number: null },
    ],
  },
  {
    name: 'Pharmacy',
    windows: [
      { name: 'Window 1', number: 'P-004' },
      { name: 'Window 2', number: null },
      { name: 'Window 3', number: null },
      { name: 'Window 4', number: null },
    ],
  },
  {
    name: 'Laboratory',
    windows: [
      { name: 'Window 1', number: null },
      { name: 'Window 2', number: null },
      { name: 'Window 3', number: null },
      { name: 'Window 4', number: null },
    ],
  },
];

const QueueDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <>
      <BreadcrumbComp title="Queue Display" items={BCrumb} />
      <div className="flex gap-6 p-6 min-h-screen bg-muted/30">
        {/* Left side - Queue List */}
        <Card className="w-80 shrink-0">
          <CardHeader className="border-b">
            <CardTitle className="text-center text-xl">Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {queueList.map((item) => (
                <div
                  key={item.id}
                  className={`py-4 text-center text-2xl font-bold ${
                    item.type === 'priority' ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {item.number}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right side - Now Serving */}
        <div className="flex-1">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h2 className="text-3xl font-bold">Now Serving</h2>
            <span className="text-2xl font-mono text-muted-foreground">
              {formatTime(currentTime)}
            </span>
          </div>
          <div className="space-y-6">
            {offices.map((office, index) => (
              <Card key={index}>
                <CardHeader className="bg-primary/10 py-3">
                  <CardTitle className="text-xl">{office.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-4 divide-x">
                    {office.windows.map((window, wIndex) => (
                      <div
                        key={wIndex}
                        className="flex flex-col items-center justify-center py-6 px-4"
                      >
                        <span className="text-sm text-muted-foreground mb-1">{window.name}</span>
                        <span className="text-3xl font-bold text-primary">
                          {window.number || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default QueueDisplay;
