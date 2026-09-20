-- ============================================================================
-- IEEE ITB Student Branch — sample events
-- ----------------------------------------------------------------------------
-- Run AFTER schema.sql (as the postgres role in the Supabase SQL Editor).
-- Dates are relative to "today" so Upcoming / Past data always looks realistic.
-- ============================================================================

insert into public.events (title, description, date, time, location, status, image_url)
values
    (
        'Welcome Party 2026',
        'Kick off the new academic year together with fellow IEEE ITB members. Games, food, networking, and a preview of everything the IEEE ITB Student Branch has in store this year.',
        current_date + interval '10 days',
        '18:00:00',
        'Aula Timur ITB',
        'upcoming',
        'https://picsum.photos/seed/ieee-welcome/800/450'
    ),
    (
        'IoT Workshop: Hands-on with ESP32',
        'A practical workshop where participants build their own IoT device with an ESP32 microcontroller. All materials are provided; basic programming knowledge is recommended.',
        current_date + interval '20 days',
        '09:00:00',
        'Lab Komputasi ITB',
        'upcoming',
        'https://picsum.photos/seed/ieee-iot/800/450'
    ),
    (
        'Guest Lecture: AI in the Real World',
        'An insightful session with industry experts discussing how artificial intelligence is shaping engineering today, complete with real case studies and career advice.',
        current_date + interval '35 days',
        '13:30:00',
        'Balai Pertemuan Ilmiah ITB',
        'upcoming',
        'https://picsum.photos/seed/ieee-ai/800/450'
    ),
    (
        'Tech Talk: Web Development 101',
        'An introductory tech talk covering modern web development, from HTML and CSS all the way to deployable fullstack applications.',
        current_date - interval '5 days',
        '19:00:00',
        'Online - Zoom',
        'past',
        'https://picsum.photos/seed/ieee-webtalk/800/450'
    ),
    (
        'Hackathon: Kobra Day 2025',
        'A 24-hour hackathon where student teams race to solve real industry problems. Prizes are awarded to the top three teams.',
        current_date - interval '18 days',
        '08:00:00',
        'Gedung Sangkuriang ITB',
        'past',
        'https://picsum.photos/seed/ieee-hack/800/450'
    ),
    (
        'Introduction to Robotics',
        'A half-day seminar introducing participants to robotics fundamentals, actuators, sensors, and microcontrollers with live demos.',
        current_date - interval '33 days',
        '10:00:00',
        'Lab Robotika ITB',
        'past',
        'https://picsum.photos/seed/ieee-robotics/800/450'
    );