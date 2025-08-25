import React from 'react';
import { Badge, Box } from '@mui/material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { Holiday } from '../types';

interface HolidayDayProps extends PickersDayProps<Date> {
  holidaysOnDay?: Holiday[];
  isExcluded?: boolean;
}

export const HolidayDay = React.forwardRef<HTMLButtonElement, HolidayDayProps>(
  ({ holidaysOnDay = [], isExcluded = false, ...other }, ref) => {
    const hasHolidays = holidaysOnDay.length > 0;

    if (!hasHolidays) {
      return <PickersDay {...other} ref={ref} />;
    }

    return (
      <Badge
        key={other.day.toString()}
        overlap="circular"
        badgeContent={
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isExcluded ? 'error.main' : 'primary.main',
              border: '1px solid',
              borderColor: 'background.paper',
            }}
          />
        }
      >
        <PickersDay
          {...other}
          ref={ref}
          sx={{
            ...other.sx,
            ...(hasHolidays && {
              backgroundColor: isExcluded ? 'error.light' : 'primary.light',
              color: isExcluded ? 'error.contrastText' : 'primary.contrastText',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: isExcluded ? 'error.main' : 'primary.main',
              },
              '&.Mui-selected': {
                backgroundColor: isExcluded ? 'error.dark' : 'primary.dark',
              },
            }),
          }}
        />
      </Badge>
    );
  }
);

HolidayDay.displayName = 'HolidayDay';
