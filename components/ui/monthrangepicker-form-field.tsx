import * as React from "react";
import { useFormContext } from "react-hook-form";
import { MonthRangePicker } from "@/components/ui/monthrangepicker";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import { useTranslations } from "next-intl";
import {useState} from "react";

interface MonthRangePickerFormFieldProps {
  startName: string; // employment.blocks.0.start
  endName: string;   // employment.blocks.0.end
  label?: string;
  disabled?: boolean;
}

export const MonthRangePickerFormField: React.FC<MonthRangePickerFormFieldProps> = ({
  startName,
  endName,
  label,
  disabled = false,
}) => {
  const { getValues, setValue } = useFormContext();
  const t = useTranslations('monthPicker');

  // 解析当前值
  const start = getValues(startName);
  const end = getValues(endName);

  // 解析为Date对象
  const parseDate = (val?: string) => {
    if (!val) return undefined;
    // 如果是当前进行时标记，返回当前日期
    if (val.toLowerCase() === 'present') return new Date();
    const [y, m] = val.split("-");
    if (!y || !m) return undefined;
    return new Date(Number(y), Number(m) - 1);
  };

  const startDate = parseDate(start);
  const endDate = parseDate(end);

  const selectedMonthRange =
    startDate && endDate
      ? { start: startDate, end: endDate }
      : undefined;

  const [open, setOpen] = React.useState(false);

  const handleChange = (range: { start: Date; end: Date }) => {
    const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setValue(startName, toStr(range.start), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setValue(endName, sameYearMonth(new Date(), range.end) ? 'present' : toStr(range.end), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setOpen(false);
  };

  const sameYearMonth = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
  }

  const formatDate = (date: Date) => {
    return`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }

  // value => 到实际展示的值
  const formatDisplayValue = (val?: string, date?: Date) => {
    if (!val) return '';
    if (val === 'present') return t('present');
    return date ? formatDate(date) : val;
  }

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            disabled={disabled}
          >
            <CalendarIcon className="ml-2 h-4 w-4"/>
            <div className="flex-1">
              {
                (start && end) ?
                  <div className="flex justify-around">
                    <span>{formatDisplayValue(start, startDate)}</span>
                    <span>~</span>
                    <span>{formatDisplayValue(end, endDate)}</span>
                  </div> :
                  t('selectStartEndDate')
              }
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <MonthRangePicker
            selectedMonthRange={selectedMonthRange}
            onMonthRangeSelect={handleChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
