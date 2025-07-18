import * as React from "react";
import { useFormContext } from "react-hook-form";
import { MonthRangePicker } from "@/components/ui/monthrangepicker";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

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
  // 解析当前值
  const start = getValues(startName);
  const end = getValues(endName);

  // 解析为Date对象
  const parseDate = (val?: string) => {
    if (!val) return undefined;
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
    setValue(endName, toStr(range.end), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setOpen(false);
  };

  const formatDate = (date: Date) => {
    return`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
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
                selectedMonthRange ?
                  <div className="flex justify-around">
                    <span>{formatDate(startDate!!)}</span>
                    <span>~</span>
                    <span>{formatDate(endDate!!)}</span>
                  </div> :
                  "请选择起止时间"
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
