export interface Task {
  Id: number
  Title: string
  Description: string
  DueDate: string
  IsCompleted: boolean
  CreatedBy: number
  CreatedAt: string
}

export let tasks: Task[] = [
  {
    Id: 1,
    Title: 'Купить продукты',
    Description: 'Молоко, хлеб, овощи',
    DueDate: '2024-04-25',
    IsCompleted: false,
    CreatedBy: 2,
    CreatedAt: '2024-04-01',
  },
  {
    Id: 2,
    Title: 'Сделать отчет',
    Description: 'Подготовить отчет для руководства о результатах за прошедший квартал.',
    DueDate: '2024-04-25',
    IsCompleted: true,
    CreatedBy: 1,
    CreatedAt: '2024-04-10',
  },
  {
    Id: 3,
    Title: 'Позвонить клиенту',
    Description: 'Уточнить детали по сотрудничеству',
    DueDate: '2024-04-25',
    IsCompleted: false,
    CreatedBy: 2,
    CreatedAt: '2024-04-03',
  },
  {
    Id: 4,
    Title: 'Запланировать встречу',
    Description: 'Согласовать время и место',
    DueDate: '2024-04-25',
    IsCompleted: false,
    CreatedBy: 1,
    CreatedAt: '2024-04-07',
  },
  {
    Id: 5,
    Title: 'Прочитать книгу',
    Description: 'Небольшой прогресс по плану чтения',
    DueDate: '2024-04-25',
    IsCompleted: false,
    CreatedBy: 2,
    CreatedAt: '2024-04-08',
  },
  {
    Id: 6,
    Title: 'Созвон с коллегами',
    Description: 'Обсуждение планов на будущее',
    DueDate: '2026-04-20',
    IsCompleted: false,
    CreatedBy: 2,
    CreatedAt: '2026-03-31',
  },
  {
    Id: 7,
    Title: 'Покормить кота',
    Description: 'Обсуждение кормёжки кота и его поведения',
    DueDate: '2026-04-22',
    IsCompleted: false,
    CreatedBy: 1,
    CreatedAt: '2026-03-31',
  },
  {
    Id: 8,
    Title: 'Сьездить на дачу',
    Description: 'Посадить картошку',
    DueDate: '2026-05-01',
    IsCompleted: false,
    CreatedBy: 3,
    CreatedAt: '2026-03-31',
  },
  {
    Id: 9,
    Title: 'Поговорить о погоде',
    Description: 'Поболтать о метереологический условиях на даче',
    DueDate: '2026-04-23',
    IsCompleted: false,
    CreatedBy: 2,
    CreatedAt: '2026-03-31',
  },
  {
    Id: 10,
    Title: 'Решить зависшую задачу',
    Description: 'Определить причину, и способрешения зависшей задачи',
    DueDate: '2026-04-25',
    IsCompleted: false,
    CreatedBy: 1,
    CreatedAt: '2026-03-31',
  },
  {
    Id: 11,
    Title: 'Провести диагностики автомобиля',
    Description: 'Провести диагностики автомобиля и определить причину неисправности м её устранением',
    DueDate: '2026-04-26',
    IsCompleted: false,
    CreatedBy: 3,
    CreatedAt: '2026-03-31',
  },
]
