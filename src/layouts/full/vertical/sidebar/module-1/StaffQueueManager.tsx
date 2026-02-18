import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Staff Queue Manager' }];

// Sample offices assigned to the staff (this would come from user's assignment)
const assignedOffices = [
  {
    id: '1',
    name: 'Emergency Room',
    nowServing: null,
    waiting: [],
  },
  {
    id: '2',
    name: 'Billing & Payment',
    nowServing: null,
    waiting: [],
  },
  {
    id: '3',
    name: 'Laboratory',
    nowServing: null,
    waiting: [],
  },
];

const StaffQueueManager = () => {
  const [offices] = useState(assignedOffices);

  const handleCallNext = (officeId: string) => {
    // TODO: Implement call next functionality
    console.log('Calling next for office:', officeId);
  };

  return (
    <>
      <BreadcrumbComp title="Staff Queue Manager" items={BCrumb} />

      <Tabs defaultValue={offices[0]?.id} className="space-y-6">
        <TabsList>
          {offices.map((office) => (
            <TabsTrigger key={office.id} value={office.id}>
              {office.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {offices.map((office) => (
          <TabsContent key={office.id} value={office.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{office.name} Queue</CardTitle>
                  <Button onClick={() => handleCallNext(office.id)}>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Call Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Now Serving Section */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg mb-4">Now Serving</h3>
                      {office.nowServing ? (
                        <div className="text-4xl font-bold text-primary">{office.nowServing}</div>
                      ) : (
                        <p className="text-muted-foreground italic">
                          No customer is currently being served.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Waiting Section */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg mb-4">
                        Waiting ({office.waiting.length})
                      </h3>
                      {office.waiting.length > 0 ? (
                        <div className="space-y-2">
                          {office.waiting.map((item: string, index: number) => (
                            <div key={index} className="text-lg font-medium text-primary">
                              {item}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">The waiting queue is empty.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
};

export default StaffQueueManager;
