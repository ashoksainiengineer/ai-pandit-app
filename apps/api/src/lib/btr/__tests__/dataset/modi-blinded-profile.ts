import { TestProfile } from './test-profiles.js';

export const MODI_BLINDED_PROFILE: TestProfile = {
    id: 'blinded-nm-1',
    fullName: 'Subject NM (Blinded)',
    dateOfBirth: '1950-09-17',
    // We intentionally skew the tentative time widely. Expected is ~11:00:00
    tentativeTime: '11:45:00',
    expectedTime: '11:00:00',
    latitude: 23.7833, // Vadnagar
    longitude: 72.6333,
    timezone: 5.5,
    offsetConfig: { preset: '30min', description: '+/- 30 mins search window' },
    forensicTraits: {
        physical: 'Charismatic speaker, distinct white beard in later life, energetic despite age.',
        psychological: 'Highly disciplined, solitary worker, visionary, polarizing figure, celibate lifestyle.',
        social: 'Started from humble beginnings (tea seller lore), rose to supreme executive power.',
    },
    lifeEvents: [
        // Early Life & Spiritual Pursuits
        { id: '524ca8b4-3030-4be0-af4b-14b38c2e84c5', category: 'travel', eventType: 'relocation', eventDate: '1968-06-15', datePrecision: 'month_year', importance: 'high', notes: 'Left home for extensive spiritual travel across the mountains.' },
        { id: '1ecb22cf-31a7-452e-8ce2-2abf1afb1547', category: 'travel', eventType: 'return', eventDate: '1970-10-10', datePrecision: 'month_year', importance: 'medium', notes: 'Returned from spiritual travels.' },

        // Organizational Rise
        { id: '81b3f0f3-da66-4c44-a8b4-382b32c314f4', category: 'career', eventType: 'employment', eventDate: '1971-05-15', datePrecision: 'month_year', importance: 'high', notes: 'Became a full-time worker for a prominent national volunteer organization.' },
        { id: '7c365b07-3827-4d27-8537-44abbe604238', category: 'career', eventType: 'achievement', eventDate: '1975-06-25', datePrecision: 'exact_date', importance: 'high', notes: 'Went underground to organize protests during national emergency.' },
        { id: 'bfd0f9f9-bfc8-4b0b-88f5-502c2545e6ab', category: 'career', eventType: 'promotion', eventDate: '1978-01-01', datePrecision: 'year_range', importance: 'medium', notes: 'Promoted to regional organizer within the volunteer group.' },
        { id: '21c15f39-0e7c-46ec-a8cc-806833c764ff', category: 'education', eventType: 'graduation', eventDate: '1978-06-15', datePrecision: 'year_range', importance: 'low', notes: 'Graduated with a BA degree (distance education).' },
        { id: '79cab743-5988-4ba8-8dfd-ce3d3b7c8037', category: 'education', eventType: 'graduation', eventDate: '1982-06-15', datePrecision: 'year_range', importance: 'low', notes: 'Completed MA degree.' },

        // Political Entry
        { id: '06736ba9-a765-4e07-802a-c463506218ed', category: 'career', eventType: 'employment', eventDate: '1985-06-10', datePrecision: 'month_year', importance: 'high', notes: 'Formally transitioned into a major national political party.' },
        { id: '2d531f27-bf0d-4e98-aeef-df0941d4d4a0', category: 'career', eventType: 'promotion', eventDate: '1987-01-15', datePrecision: 'year_range', importance: 'high', notes: 'Elected organizing secretary for the state unit.' },
        { id: 'cfa358e1-e8b8-47b8-9a43-ee79b4bd2f5e', category: 'career', eventType: 'success', eventDate: '1990-09-25', datePrecision: 'exact_date', importance: 'medium', notes: 'Key strategist for a major national political chariot procession.' },
        { id: '06bc2db4-b1a2-45fd-b9b7-b652393bb2bf', category: 'career', eventType: 'success', eventDate: '1995-03-15', datePrecision: 'month_year', importance: 'high', notes: 'Instrumental in party winning state elections.' },
        { id: '99635ac6-34e0-46e8-b434-7ffd3bf26e39', category: 'career', eventType: 'promotion', eventDate: '1995-11-20', datePrecision: 'month_year', importance: 'high', notes: 'Appointed National Secretary, moved to national capital.' },
        { id: '6ffdb2e6-2716-4f34-8f50-3f703e57ab4e', category: 'career', eventType: 'promotion', eventDate: '1998-05-15', datePrecision: 'month_year', importance: 'high', notes: 'Promoted to General Secretary of the national party.' },

        // Executive Power (State Level)
        { id: '1949f842-0f9a-4745-a853-b0bee5a5a5b9', category: 'career', eventType: 'promotion', eventDate: '2001-10-07', datePrecision: 'exact_date', importance: 'critical', notes: 'Appointed as Chief Minister of the state.' },
        { id: 'a3795281-d550-4849-8049-baf87ca1ff65', category: 'health', eventType: 'accident', eventDate: '2001-01-26', datePrecision: 'exact_date', importance: 'critical', notes: 'Devastating earthquake in the state requiring massive disaster management (just before becoming CM).' }, // Contextual prestige
        { id: '13deb830-b005-40b3-abf0-d31c0ae79ad0', category: 'family', eventType: 'death', eventDate: '2002-02-27', datePrecision: 'exact_date', importance: 'critical', notes: 'Massive violent riots in the state; faced severe administrative and public scrutiny.' },
        { id: 'fc254151-f744-4483-be2a-22ee1c07e32a', category: 'career', eventType: 'success', eventDate: '2002-12-15', datePrecision: 'month_year', importance: 'high', notes: 'Won state elections with a significant majority after the riots.' },
        { id: '08da0f98-1440-49b3-89a8-b336eebe9598', category: 'travel', eventType: 'relocation', eventDate: '2005-03-18', datePrecision: 'exact_date', importance: 'high', notes: 'Denied diplomatic visa by a major western nation due to human rights controversies.' },
        { id: '7e0349f3-b1f1-4fa7-8940-9c6f57638ae5', category: 'career', eventType: 'success', eventDate: '2007-12-23', datePrecision: 'exact_date', importance: 'high', notes: 'Re-elected as Chief Minister (3rd term).' },
        { id: '53060044-2ba5-4ce3-9509-16286abd367f', category: 'career', eventType: 'achievement', eventDate: '2008-10-07', datePrecision: 'exact_date', importance: 'medium', notes: 'Successfully secured relocation of a major automobile manufacturing plant to the state.' },
        { id: '164d6d15-65f8-49a5-a84a-92b20aa15b88', category: 'career', eventType: 'success', eventDate: '2012-12-20', datePrecision: 'exact_date', importance: 'high', notes: 'Re-elected as Chief Minister (4th term).' },

        // National Leadership
        { id: '1df29c66-0717-4976-82d5-844a2ae29267', category: 'career', eventType: 'promotion', eventDate: '2013-09-13', datePrecision: 'exact_date', importance: 'critical', notes: 'Named prime ministerial candidate for the national party.' },
        { id: 'a1bf18b0-dfb2-4082-97ca-c460be73a6bb', category: 'health', eventType: 'accident', eventDate: '2013-10-27', datePrecision: 'exact_date', importance: 'high', notes: 'Bomb blasts occurred at a major political rally he was addressing.' },
        { id: '2f66ce57-6f6b-4a45-8b26-6105c64ac26a', category: 'career', eventType: 'success', eventDate: '2014-05-16', datePrecision: 'exact_date', importance: 'critical', notes: 'Led party to a historic absolute majority in national elections.' },
        { id: '08f91107-e524-49e2-8c39-bcb73c7d485c', category: 'career', eventType: 'promotion', eventDate: '2014-05-26', datePrecision: 'exact_date', importance: 'critical', notes: 'Sworn in as Prime Minister of the country.' },

        // Prime Ministerial Tenure - Term 1
        { id: '3f444872-c95f-4f34-b555-cb6959367712', category: 'career', eventType: 'achievement', eventDate: '2014-08-15', datePrecision: 'exact_date', importance: 'medium', notes: 'Announced massive financial inclusion scheme.' },
        { id: 'dd35449b-5ff4-4513-8e37-f3c43e6b379c', category: 'career', eventType: 'achievement', eventDate: '2014-09-28', datePrecision: 'exact_date', importance: 'medium', notes: 'Madison Square Garden highly publicized address in foreign nation.' },
        { id: '9e3ec066-706c-4e91-a2de-a70d519dc0bc', category: 'career', eventType: 'achievement', eventDate: '2015-12-25', datePrecision: 'exact_date', importance: 'high', notes: 'Surprise diplomatic visit to a historically hostile neighboring country.' },
        { id: 'f37fe711-bee5-4e2e-b0ba-e7a0c609d0ea', category: 'career', eventType: 'achievement', eventDate: '2016-11-08', datePrecision: 'exact_date', importance: 'critical', notes: 'Announced sudden invalidation of massive percentage of national currency (Demonetization).' },
        { id: '11495ab9-9484-4cea-82f7-ac7985594e28', category: 'career', eventType: 'success', eventDate: '2016-09-29', datePrecision: 'exact_date', importance: 'high', notes: 'Authorized cross-border military strikes against militant launch pads.' },
        { id: '52a6c01f-255c-4f00-b44c-df03e32d2300', category: 'career', eventType: 'achievement', eventDate: '2017-07-01', datePrecision: 'exact_date', importance: 'high', notes: 'Rolled out unified national tax system.' },
        { id: '96f42211-cda9-4e57-8d93-947d1dc933d4', category: 'career', eventType: 'conflict', eventDate: '2017-06-16', datePrecision: 'month_year', importance: 'high', notes: 'Major border standoff initiated with northern superpower.' },
        { id: 'f237b4ea-8495-4a07-89d6-5c8221c0675e', category: 'career', eventType: 'success', eventDate: '2019-02-26', datePrecision: 'exact_date', importance: 'critical', notes: 'Authorized historic pre-emptive aerial strikes in enemy territory.' },

        // Prime Ministerial Tenure - Term 2
        { id: '18b8c0cf-004d-4e7f-ad93-ab3d1e44d2f8', category: 'career', eventType: 'success', eventDate: '2019-05-23', datePrecision: 'exact_date', importance: 'critical', notes: 'Won second term as Prime Minister with an even larger absolute majority.' },
        { id: 'e41d7784-c81b-4a33-829b-d83ef72107b2', category: 'career', eventType: 'achievement', eventDate: '2019-08-05', datePrecision: 'exact_date', importance: 'critical', notes: 'Revoked special autonomous status of a highly sensitive northern state.' },
        { id: 'a3831afc-676c-457b-986e-494b3d0a5e6b', category: 'career', eventType: 'conflict', eventDate: '2019-12-11', datePrecision: 'exact_date', importance: 'high', notes: 'Passed controversial citizenship amendment law triggering massive nationwide protests.' },
        { id: 'eb24e251-b2e8-4cb5-b29f-03086acfa7fa', category: 'health', eventType: 'accident', eventDate: '2020-03-24', datePrecision: 'exact_date', importance: 'critical', notes: 'Announced strictly enforced nationwide lockdown due to global pandemic.' },
        { id: 'a63b48c3-5292-4a03-9214-9d830f5ccb00', category: 'career', eventType: 'conflict', eventDate: '2020-06-15', datePrecision: 'exact_date', importance: 'high', notes: 'Deadly border clash with northern superpower resulting in troop casualties.' },
        { id: '00cf96d0-5b0a-4286-a68e-e69100a2b042', category: 'career', eventType: 'achievement', eventDate: '2020-08-05', datePrecision: 'exact_date', importance: 'high', notes: 'Performed groundbreaking ceremony for a historic, highly contested religious temple.' },
        { id: 'e95d6544-97c4-4b7a-9811-2d4d3dc2dd83', category: 'career', eventType: 'conflict', eventDate: '2020-11-26', datePrecision: 'month_year', importance: 'high', notes: 'Start of massive, year-long agricultural protests against new farming laws.' },
        { id: 'ccd202b1-3918-4a58-90c1-27b90f0fcad9', category: 'career', eventType: 'failure', eventDate: '2021-11-19', datePrecision: 'exact_date', importance: 'high', notes: 'Announced repeal of the controversial farming laws following sustained protests.' },
        { id: 'dc8a4206-5676-4295-a353-d9cf7e9e7bbb', category: 'career', eventType: 'success', eventDate: '2022-03-10', datePrecision: 'month_year', importance: 'high', notes: 'Led party to retain power in the most politically crucial state elections.' },
        { id: 'fd08e389-4e06-47f7-ac17-7c0f31cdeb87', category: 'family', eventType: 'death', eventDate: '2022-12-30', datePrecision: 'exact_date', importance: 'critical', notes: 'Mother passed away at the age of 99.' },
        { id: '503bdab6-451c-4fa1-87df-2385873ed404', category: 'career', eventType: 'success', eventDate: '2023-08-23', datePrecision: 'exact_date', importance: 'high', notes: 'Nation successfully landed spacecraft on the lunar south pole under his administration.' },
        { id: '7c7c7694-c749-48cf-9c23-cb0d52344f84', category: 'career', eventType: 'achievement', eventDate: '2023-09-09', datePrecision: 'exact_date', importance: 'high', notes: 'Successfully hosted global summit of major world economies.' },
        { id: '3eed8ef0-1d0c-47ca-a796-29b3cc059c6e', category: 'career', eventType: 'achievement', eventDate: '2024-01-22', datePrecision: 'exact_date', importance: 'critical', notes: 'Presided over the consecration ceremony of a historic religious temple.' },

        // Prime Ministerial Tenure - Term 3
        { id: '699dd908-a0f7-46fa-aae7-71184f8d4954', category: 'career', eventType: 'success', eventDate: '2024-06-04', datePrecision: 'exact_date', importance: 'critical', notes: 'Won third consecutive term as Prime Minister, though lost absolute single-party majority.' },
        { id: 'd354640b-b451-41ee-af81-fe9e75f6b590', category: 'career', eventType: 'promotion', eventDate: '2024-06-09', datePrecision: 'exact_date', importance: 'critical', notes: 'Sworn in for third term as Prime Minister at the head of a coalition government.' },

        // Personal / Health / Misc (Approximate Dates for General Blinding)
        { id: '3bd56b7c-9d39-4757-a8f1-9f4946468c0d', category: 'health', eventType: 'illness', eventDate: '2001-08-15', datePrecision: 'year_range', importance: 'low', notes: 'Minor surgical procedure.' },
        { id: 'f41149e3-5ef1-4749-81c7-4659008fce6d', category: 'family', eventType: 'marriage', eventDate: '1968-05-15', datePrecision: 'year_range', importance: 'low', notes: 'Child marriage arranged, which he reportedly walked away from shortly after to pursue spirituality.' },
        { id: '9fe5b78f-07b6-431b-a584-0f5e11dab656', category: 'career', eventType: 'achievement', eventDate: '2016-06-08', datePrecision: 'exact_date', importance: 'medium', notes: 'Addressed the joint session of a major western nation’s congress.' },
        { id: 'a4d3427d-5104-4ebc-ba00-e423959d120a', category: 'career', eventType: 'achievement', eventDate: '2018-05-25', datePrecision: 'month_year', importance: 'low', notes: 'Launched massive national health protection scheme.' }
    ]
};
